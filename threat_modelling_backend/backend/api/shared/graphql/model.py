# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

from dataclasses import dataclass
from pydantic import BaseModel, Field
from typing import Literal, Optional


@dataclass
class Mutation:
    query: str
    field_set: set[int] | set[str] | dict[int, bool] | dict[str, bool]


# GraphQL translation types
# These types SHOULD be equal to the types in the graphql schema, ideally we could even auto-generate them from the schema

class ComponentInput(BaseModel):
    id: str
    name: str
    componentType: str
    description: str


class DiagramInput(BaseModel):
    id: str
    s3Prefix: str
    modelId: Literal[
        "anthropic.claude-3-sonnet-20240229-v1:0",
        "anthropic.claude-3-5-sonnet-20240620-v1:0",
        "anthropic.claude-3-haiku-20240307-v1:0"
    ] = Field("anthropic.claude-3-5-sonnet-20240620-v1:0")
    userDescription: str = Field("")


class ExtractComponentsInput(BaseModel):
    id: str
    s3Prefix: str
    modelId: Literal[
        "anthropic.claude-3-sonnet-20240229-v1:0",
        "anthropic.claude-3-5-sonnet-20240620-v1:0",
        "anthropic.claude-3-haiku-20240307-v1:0"
    ] = Field("anthropic.claude-3-5-sonnet-20240620-v1:0")
    diagramDescription: str


class GenerateThreatsInput(BaseModel):
    id: str
    s3Prefix: str
    diagramDescription: str
    component: ComponentInput
    threatType: str

    userDescription: str = Field("")
    modelId: Optional[str] = None


class DREADScoreInput(BaseModel):
    damage: int
    reproducibility: int
    exploitability: int
    affectedUsers: int
    discoverability: int


class UpdateComponentInput(BaseModel):
    id: str
    diagramId: str
    componentId: str

    name: Optional[str] = None
    description: Optional[str] = None
    componentType: Optional[str] = None


class CreateComponentInput(BaseModel):
    id: str
    diagramId: str

    name: Optional[str] = None
    description: Optional[str] = None
    componentType: Optional[str] = None


class UpdateThreatInput(BaseModel):
    id: str
    diagramId: str
    componentId: str
    threatId: str

    name: Optional[str] = None
    description: Optional[str] = None
    threatType: Optional[str] = None
    dreadScores: Optional[DREADScoreInput] = None
    action: Optional[str] = None
    reason: Optional[str] = None


class Report(BaseModel):
    presignedUrl: str


# Convenience types for simplifying posting mutations

DiagramDescriptionMutation = Mutation(
    query='''
mutation DiagramDescriptionCreated($id: ID!, $diagramDescription: String!) {
    diagramDescription(id: $id, diagramDescription: $diagramDescription) {       
        id
        s3Prefix
        userDescription
        diagramDescription
        status
    }
}
    ''',
    field_set={"id", "s3Prefix", "userDescription", "diagram_description", "status"})

ComponentsMutation = Mutation(
    query='''
mutation ExtractedComponents($id: ID!, $components: [ComponentInput]) {
    components(id: $id, components: $components) {
        id
        components {
            id
            name
            description
            componentType
        }
    }
}
''',
    field_set={
        "id": True,
        "components": {
            "__all__": {
                # since components is a list, we need this special syntax (https://docs.pydantic.dev/latest/concepts/serialization/#advanced-include-and-exclude)
                "id", "name", "description", "component_type"
            }
        }
    })

ThreatsMutation = Mutation(
    query='''
mutation threatsGenerated($id: ID!, $components: [ComponentInput]) {
    threats(id: $id, components: $components) {       
        id
        components {
            id
            name
            description
            componentType
            threats {
                id
                name
                description
                threatType
                action
                reason
                dreadScores {
                    damage
                    reproducibility
                    exploitability
                    affectedUsers
                    discoverability
                }
            }
        }
    }
}
''',
    field_set={
        "id": True,
        "components": {
            "__all__": {
                # since components is a list, we need this special syntax (https://docs.pydantic.dev/latest/concepts/serialization/#advanced-include-and-exclude)
                "id": True, "name": True, "description": True, "component_type": True, "reason": True, "threats": {
                    "__all__": {
                        "id": True, "name": True, "description": True, "stride_type": True, "action": True,
                        "dread_scores": {
                            "damage", "reproducibility", "exploitability", "affected_users", "discoverability"
                        }
                    }
                }
            }
        }
    })
