# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

from abc import ABC, abstractmethod
from genai_core.model import ThreatModel, Diagram, Component, Threat


class DeleteItemException(Exception):
    def __init__(self, message: str, errors: list[str]):
        super().__init__(message)

        self.errors = errors


class NotFoundException(Exception):
    pass


class ThreatModelRepository(ABC):
    @abstractmethod
    def get(self, threat_model_id: str) -> ThreatModel: ...

    @abstractmethod
    def get_diagram(self, diagram_id: str) -> Diagram: ...

    @abstractmethod
    def get_component(self, component_id: str) -> Component: ...

    @abstractmethod
    def get_threat(self, threat_id: str) -> Threat: ...

    @abstractmethod
    def save(self, threat_model: ThreatModel) -> None: ...

    @abstractmethod
    def save_diagram(self, diagram: Diagram) -> None: ...

    @abstractmethod
    def save_diagrams(self, diagrams: list[Diagram]) -> None: ...


    @abstractmethod
    def save_component(self, component: Component) -> None: ...

    @abstractmethod
    def save_components(self, components: list[Component]) -> None: ...


    @abstractmethod
    def save_threat(self, threat: Threat) -> None: ...

    @abstractmethod
    def save_threats(self, threats: list[Threat]) -> None: ...

    # @abstractmethod
    # def delete(self, threat_model_id: str) -> None:
    #     """ we recommend implementing soft-deletes """
    #     pass

    @abstractmethod
    def delete_component(self, component_id: str) -> None: ...

    @abstractmethod
    def delete_threat(self, threat_id: str) -> None: ...

    @abstractmethod
    def list_diagrams(self) -> list[Diagram]: ...
