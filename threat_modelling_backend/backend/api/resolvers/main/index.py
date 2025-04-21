# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import boto3
import os

from aws_lambda_powertools import Logger, Metrics
from aws_lambda_powertools.event_handler import AppSyncResolver
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext

from graphql.model import (
    DiagramInput, ExtractComponentsInput, DiagramDescriptionMutation, ComponentsMutation
)
from graphql.notifier import notify

from genai_core.repository import ThreatModelRepository
from genai_core.adapter import DynamoDBThreatModelRepository
from genai_core.diagram_describer import get_diagram_description
from genai_core.dfd_extractor import get_dfd_from_diagram_and_description
from genai_core.model import ThreatModel, Diagram, Component

from routers.sync_resolvers import router as sync_resolvers_router

logger = Logger()
metrics = Metrics()
app = AppSyncResolver()

DATA_BUCKET_NAME = os.environ["DATA_BUCKET_NAME"]

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

s3_client = boto3.session.Session().client("s3")

app.include_router(sync_resolvers_router)


def read_s3_object(prefix: str, bucket_name=DATA_BUCKET_NAME) -> bytes:
    logger.info(f"Reading object {bucket_name}/{prefix}")
    s3_object = s3_client.get_object(Bucket=bucket_name, Key=prefix)
    return s3_object["Body"].read()


@app.resolver(type_name="Mutation", field_name="extractComponents")
@notify(ComponentsMutation)
def extract_components(extractComponentsInput: dict) -> Diagram:
    extract_components_input = ExtractComponentsInput(**extractComponentsInput)
    diagram_id = extract_components_input.id

    image = read_s3_object(prefix=extract_components_input.s3Prefix)

    dfd = get_dfd_from_diagram_and_description(image=image,
                                               diagram_description=extract_components_input.diagramDescription,
                                               model_id=extract_components_input.modelId)

    logger.info({"dfd": dfd})

    components = [Component(**c.model_dump(exclude={"diagram_id"}), diagram_id=diagram_id) for c in dfd.components]

    diagram = Diagram(id=diagram_id,
                      threat_model_id=diagram_id,
                      s3_prefix=extract_components_input.s3Prefix,
                      diagram_description=extract_components_input.diagramDescription,
                      components=components)

    if repository:
        logger.info(f"Persisting components {components}")
        repository.save_components(components)

    return diagram


@app.resolver(type_name="Mutation", field_name="createDiagramDescription")
@notify(DiagramDescriptionMutation)
def create_diagram(diagramInput: dict) -> Diagram:
    diagram_input = DiagramInput(**diagramInput)

    image = read_s3_object(prefix=diagram_input.s3Prefix)

    description = get_diagram_description(image=image,
                                          model_id=diagram_input.modelId,
                                          user_description=diagram_input.userDescription)

    logger.info({"description": description})

    threat_model = ThreatModel(id=diagram_input.id)
    diagram = Diagram(id=diagram_input.id,
                      threat_model_id=diagram_input.id,
                      s3_prefix=diagram_input.s3Prefix,
                      user_description=diagram_input.userDescription,
                      diagram_description=description)

    if repository:
        logger.info(f"Persisting diagram {diagram} to threat_model {threat_model}")
        repository.save(threat_model)
        repository.save_diagram(diagram)

    return diagram


@metrics.log_metrics
@logger.inject_lambda_context(correlation_id_path=correlation_paths.APPSYNC_RESOLVER, log_event=True)
def lambda_handler(event: dict, context: LambdaContext):
    return app.resolve(event, context)
