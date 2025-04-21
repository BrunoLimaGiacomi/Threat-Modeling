# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

from enum import Enum
from pydantic import BaseModel, Field, ConfigDict
from pydantic.json_schema import SkipJsonSchema
from typing import Literal, Optional
from uuid import uuid4

from genai_core.utils import ParseBedrockResponseMixin


class StrideType(Enum):
    SPOOFING = "Spoofing"
    TAMPERING = "Tampering"
    REPUDIATION = "Repudiation"
    INFORMATION_DISCLOSURE = "InformationDisclosure"
    DENIAL_OF_SERVICE = "DenialOfService"
    ELEVATION_OF_PRIVILEGES = "ElevationOfPrivileges"


class DREAD(BaseModel):
    """
    Lists each DREAD risk score in a scale of 1 to 10. You must NOT give suggestions that might be used to instruct malicious actors, simply give the score as a number. This is used in a Threat Model.
    """
    damage: int = Field(..., ge=1, le=10, description="From 1 to 10, how bad would an attack be if successful?")
    reproducibility: int = Field(..., ge=1, le=10, description="From 1 to 10, how easy is it to reproduce the attack?")
    exploitability: int = Field(..., ge=1, le=10, description="From 1 to 10, how much work is it to launch the attack?")
    affected_users: int = Field(..., ge=1, le=10,
                                description="From 1 to 10, What would be the scale of affected people? Where 1 means very few people and 10 means all users.",
                                alias="affectedUsers")
    discoverability: int = Field(..., ge=1, le=10,
                                 description="From 1 to 10, how easy is it to discover the threat? Where 1 means only nation-state actors would be capable of finding, and 10 means anyone with basic internet knowledge could find it.")

    class Config:
        populate_by_name = True
        extra = "forbid"
        use_enum_values = True

    def __str__(self):
        return f"Damage: {self.damage} | Reproducibility: {self.reproducibility} | Exploitability: {self.exploitability} | Affected users: {self.affected_users} | Discoverability: {self.discoverability}"


class DFDThreat(BaseModel):
    """
    Represents a single STRIDE-typed threat in the context of a Threat Model
    """
    name: str = Field(..., description="One sentence description for this STRIDE threat")
    stride_type: StrideType = Field(..., description="The STRIDE type of this threat", alias="threatType")
    description: str = Field(...,
                             description="Full description of this STRIDE threat")
    dread_scores: DREAD = Field(..., alias="dreadScores")

    class Config:
        populate_by_name = True
        use_enum_values = True

    def __str__(self):
        return f"Threat [{self.stride_type}]: {self.name} - {self.description} [DREAD Score: {self.dread_scores}]"


class Threats(BaseModel, ParseBedrockResponseMixin):
    """
    Represents a list of identified Threats in the context of a Threat Model
    """
    threats: list[DFDThreat]

    def __str__(self):
        return "\n".join([f"- {str(t)}" for t in self.threats])


class Threat(DFDThreat):
    id: str = Field(default_factory=lambda: str(uuid4()))
    component_id: str = Field(...)
    action: str = "Mitigate"
    reason: str = Field("")


DFDComponentType = Literal["Process", "DataStore", "Actor", "TrustBoundary", "DataFlow", "ExternalEntity"]


class DFDComponent(BaseModel):
    """
    Represents a single Data Flow Diagram Component
    """
    model_config = ConfigDict(populate_by_name=True)

    id: SkipJsonSchema[str] = Field(default_factory=lambda: str(uuid4()))

    component_type: DFDComponentType = Field(..., alias="componentType")
    name: str
    description: Optional[str] = Field("",
                                       description="Detailed description of this component, including technology, for example Amazon SQS queue, or ElasticSearch database.")

    def __str__(self):
        return f"Component type: {self.component_type}, Name: {self.name}, Description: {self.description}"


class DFD(BaseModel, ParseBedrockResponseMixin):
    """
    Represents a Data Flow Diagram
    """
    components: list[DFDComponent]


class Component(DFDComponent):
    diagram_id: str = Field(...)
    threats: list[Threat] = Field(default_factory=list)

    def __str__(self):
        return super().__str__() + f"Threats: {self.threats}"


class Diagram(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: SkipJsonSchema[str] = Field(default_factory=lambda: str(uuid4()))
    threat_model_id: SkipJsonSchema[str] = Field()

    s3_prefix: str = Field(..., alias="s3Prefix")
    user_description: str = Field("",
                                  description="This hand-crafter description aids the LLM in generating a better description.",
                                  alias="userDescription")
    diagram_description: str = Field(..., alias="diagramDescription")
    components: list[Component] = Field([])

    status: Literal["NA", "GENERATING_THREATS", "THREATS_GENERATED"] = Field("NA")


class ThreatModel(BaseModel):
    """
    This is our outer abstraction. We propose that a threat model can (should) be composed of multiple small
    self-contained diagrams that are both simple enough for an LLM to reason about, but most importantly, for Humans to
    analyze in single look.

    For this prototype however, we are only supporting ThreatModels with a single Diagram instance, but this is
    implemented to evolve in the future to support multiple diagrams.
    """
    id: SkipJsonSchema[str] = Field()
    diagrams: list[Diagram] = Field([])
