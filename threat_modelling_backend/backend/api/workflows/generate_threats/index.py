# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import boto3
import os

from botocore.config import Config
from botocore.exceptions import ClientError

from aws_lambda_powertools import Logger, Metrics
from aws_lambda_powertools.metrics import MetricUnit

from graphql.model import GenerateThreatsInput, ThreatsMutation
from graphql.notifier import notify

from genai_core.repository import ThreatModelRepository
from genai_core.adapter import DynamoDBThreatModelRepository
from genai_core.model import DFDComponent, DFDComponentType, ThreatModel, Diagram, Component, Threat
from genai_core.threats_generator import get_threats_for_component

logger = Logger()
metrics = Metrics()

DATA_BUCKET_NAME = os.environ["DATA_BUCKET_NAME"]

s3_client = boto3.session.Session().client("s3", config=Config(retries={"max_attempts": 3, "mode": "adaptive"}))

THREAT_MODELS_TABLE_NAME = os.getenv("THREAT_MODELS_TABLE_NAME")
DIAGRAMS_TABLE_NAME = os.getenv("DIAGRAMS_TABLE_NAME", "Diagrams")
COMPONENTS_TABLE_NAME = os.getenv("COMPONENTS_TABLE_NAME", "Components")
THREATS_TABLE_NAME = os.getenv("THREATS_TABLE_NAME", "Threats")

repository: ThreatModelRepository = DynamoDBThreatModelRepository.from_table_names(
    threat_models_table_name=THREAT_MODELS_TABLE_NAME,
    diagrams_table_name=DIAGRAMS_TABLE_NAME,
    components_table_name=COMPONENTS_TABLE_NAME,
    threats_table_name=THREATS_TABLE_NAME,
) if (THREAT_MODELS_TABLE_NAME and DIAGRAMS_TABLE_NAME and COMPONENTS_TABLE_NAME and THREATS_TABLE_NAME) else None


def read_s3_object(bucket_name, prefix) -> bytes:
    s3_object = s3_client.get_object(Bucket=bucket_name, Key=prefix)
    return s3_object["Body"].read()


def write_threatmodel_as_jsonline_to_s3(bucket_name, prefix, threat_model: ThreatModel):
    """
    TODO: writing individual files is not very performant, it would be better to stream results to a Firehose
    """
    jsonline = threat_model.model_dump_json() + "\n"

    try:
        s3_client.put_object(
            Bucket=bucket_name,
            Key=prefix,
            Body=jsonline.encode("utf-8"),
            ContentType="application/json",
        )
        logger.info("Wrote jsonline to s3")
    except ClientError as e:
        metrics.add_metric("writeJsonLineClientError", unit=MetricUnit.Count, value=1.0)
        logger.error(f"Failed to upload jsonline: {e}")
    except Exception as e:
        metrics.add_metric("writeJsonLineUnknownException", unit=MetricUnit.Count, value=1.0)
        logger.error(f"Failed to upload jsonline with unknown error: {e}")


@notify(ThreatsMutation)
def generate_threats(generateThreatsInput: dict):
    generate_threats_input = GenerateThreatsInput.model_validate(generateThreatsInput)

    # We will not generate threats for Trust Boundary and Data Flow typed components. They seem to be redundant with other threats
    # generated for processes, actors and data stores
    SKIPPED_COMPONENT_TYPES: list[DFDComponentType] = ["TrustBoundary", "DataFlow"]
    if generate_threats_input.component.componentType in SKIPPED_COMPONENT_TYPES:
        logger.warning(
            f"Skipping threat generation for {generate_threats_input.component.componentType} component "
            f"[{generate_threats_input.component.id}] {generate_threats_input.component.name}"
        )
        return None

    image = read_s3_object(bucket_name=DATA_BUCKET_NAME, prefix=generate_threats_input.s3Prefix)

    component = DFDComponent(id=generate_threats_input.component.id,
                             diagram_id=generate_threats_input.id,  # TODO: update this to be component.diagram_id
                             name=generate_threats_input.component.name,
                             component_type=generate_threats_input.component.componentType,
                             description=generate_threats_input.component.description)

    dfd_threats = get_threats_for_component(
        image=image,
        diagram_description=generate_threats_input.diagramDescription,
        dataflow_component=component,
        stride_type=generate_threats_input.threatType,
        iterations=1,
        model_id=generate_threats_input.modelId
    ).threats

    logger.info({f"{generate_threats_input.threatType} threats": dfd_threats})

    threats = [
        Threat(component_id=component.id, **threat.model_dump())
        for threat in dfd_threats
    ]

    partial_diagram = Diagram(
        id=generate_threats_input.id,
        threat_model_id=generate_threats_input.id,  # TODO: update this to be the threat model's id
        s3_prefix=generate_threats_input.s3Prefix,
        user_description=generate_threats_input.userDescription,
        diagram_description=generate_threats_input.diagramDescription,
        components=[
            Component(**component.model_dump(), diagram_id=generate_threats_input.id, threats=threats)
        ]
    )

    if repository:
        repository.save_threats(threats)

    # persist to s3 to allow for Athena querying
    response_s3_prefix = f"db/threats/{partial_diagram.id}-{component.id}-{generate_threats_input.threatType}-{component.component_type}.jsonl"
    write_threatmodel_as_jsonline_to_s3(DATA_BUCKET_NAME, response_s3_prefix,
                                        ThreatModel(id=partial_diagram.id, diagrams=[partial_diagram]))

    return partial_diagram


@metrics.log_metrics
@logger.inject_lambda_context(log_event=True)
def lambda_handler(event, context):
    generate_threats(event)
