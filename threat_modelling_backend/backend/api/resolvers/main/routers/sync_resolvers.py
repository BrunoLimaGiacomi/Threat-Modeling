# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import os

from aws_lambda_powertools import Logger
from aws_lambda_powertools.event_handler.appsync import Router

from genai_core.adapter import DynamoDBThreatModelRepository
from genai_core.model import Component
from genai_core.repository import ThreatModelRepository, DeleteItemException

from graphql.model import CreateComponentInput, UpdateComponentInput, UpdateThreatInput, Report

from services.create_xlsx_report_svc import generate_report as generate_report_svc

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

logger = Logger()
router = Router()


@router.resolver(type_name="Query", field_name="getDiagram")
def get_diagram(id: str) -> dict:
    threat_model = repository.get(id)

    logger.info({"threat_model": threat_model})

    # we currently only support single diagram threat models
    return threat_model.diagrams[0].model_dump(by_alias=True)


@router.resolver(type_name="Mutation", field_name="deleteThreat")
def delete_threat(threatId: str) -> dict:
    try:
        repository.delete_threat(threatId)
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

    return {
        "success": True,
        "message": f"Threat {threatId} deleted successfully"
    }


@router.resolver(type_name="Mutation", field_name="deleteComponent")
def delete_component(componentId: str) -> dict:
    try:
        repository.delete_component(componentId)
    except DeleteItemException as e:
        return {
            "success": False,
            "message": f"{str(e)} - Threats belonging to component {componentId}: {' | '.join(e.errors)}"
        }

    return {
        "success": True,
        "message": f"Component {componentId} deleted successfully"
    }


@router.resolver(type_name="Query", field_name="listDiagrams")
def list_diagrams() -> list[dict]:
    """
    TODO: this should be a list_threat_models, since this supports the list view frontend page
    will keep this as is for now, but it's slightly confusing
    """
    diagrams = repository.list_diagrams()

    logger.info({"diagrams": diagrams})

    return [d.model_dump(by_alias=True) for d in diagrams]


@router.resolver(type_name="Mutation", field_name="updateThreat")
def update_threat(updateThreatInput: dict) -> dict:
    update_threat_input = UpdateThreatInput.model_validate(updateThreatInput)
    threat = repository.get_threat(update_threat_input.threatId)

    # since we accept partial parameters, we might get some
    params = update_threat_input.model_dump(exclude={"id", "diagramId", "componentId", "threatId"})
    params_to_update = {k: params[k] for k in params if params[k] is not None}

    # pydantic doesn't support model_copy with aliases, so we need to map aliases from params_to_update back to field names
    field_mapping = {field.alias: name for name, field in threat.model_fields.items() if field.alias}
    mapped_params = {field_mapping.get(k, k): v for k, v in params_to_update.items()}

    updated_threat = threat.model_copy(update=mapped_params)

    repository.save_threat(updated_threat)

    return updated_threat.model_dump(by_alias=True)


@router.resolver(type_name="Mutation", field_name="updateComponent")
def update_component(updateComponentInput: dict) -> dict:
    update_component_input = UpdateComponentInput.model_validate(updateComponentInput)
    component = repository.get_component(update_component_input.componentId)

    # since we accept partial parameters, we might get some
    params = update_component_input.model_dump(exclude={"id", "diagramId", "componentId"})
    params_to_update = {k: params[k] for k in params if params[k] is not None}

    # pydantic doesn't support model_copy with aliases, so we need to map aliases from params_to_update back to field names
    field_mapping = {field.alias: name for name, field in component.model_fields.items() if field.alias}
    mapped_params = {field_mapping.get(k, k): v for k, v in params_to_update.items()}

    updated_component = component.model_copy(update=mapped_params)

    repository.save_component(updated_component)

    return updated_component.model_dump(by_alias=True)


@router.resolver(type_name="Mutation", field_name="createComponent")
def create_component(createComponentInput: dict) -> dict:
    create_component_input = CreateComponentInput.model_validate(createComponentInput)

    component = Component(
        diagram_id=create_component_input.diagramId,
        name=create_component_input.name,
        description=create_component_input.description,
        component_type=create_component_input.componentType,
    )

    repository.save_component(component)

    return component.model_dump(by_alias=True)


@router.resolver(type_name="Mutation", field_name="generateReport")
def generate_report(threat_model_id: str) -> dict:
    threat_model = repository.get(threat_model_id)
    presigned_download_link = generate_report_svc(threat_model)

    report = Report(presignedUrl=presigned_download_link)

    return report.model_dump(by_alias=True)
