# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import boto3
from botocore.exceptions import ClientError
import os
from typing import TYPE_CHECKING

from pynamodb.exceptions import DoesNotExist

from genai_core.model import ThreatModel, Diagram, Component, Threat, DREAD

if TYPE_CHECKING:
    from mypy_boto3_dynamodb.service_resource import Table as DynamoDBTable
else:
    DynamoDBTable = object

from genai_core.repository import ThreatModelRepository, DeleteItemException, NotFoundException
from genai_core.adapter.dynamo_db_data_model import ThreatModelDataModel, DiagramDataModel, ComponentDataModel, \
    ThreatDataModel

AWS_REGION = os.getenv("AWS_REGION",
                       "us-east-1")  # we assume the runtime will have this defined, if not, please define yourself


class DynamoDBThreatModelRepository(ThreatModelRepository):
    """ TODO: create proper exception types """

    def __init__(self,
                 threat_models: DynamoDBTable,
                 diagrams: DynamoDBTable,
                 components: DynamoDBTable,
                 threats: DynamoDBTable):
        self.threat_models = threat_models
        self.diagrams = diagrams
        self.components = components
        self.threats = threats

    @classmethod
    def from_table_names(cls,
                         threat_models_table_name: str,
                         diagrams_table_name: str,
                         components_table_name: str,
                         threats_table_name: str) -> "DynamoDBThreatModelRepository":
        session = boto3.session.Session(region_name=AWS_REGION)

        threat_models = session.resource("dynamodb").Table(threat_models_table_name)
        diagrams = session.resource("dynamodb").Table(diagrams_table_name)
        components = session.resource("dynamodb").Table(components_table_name)
        threats = session.resource("dynamodb").Table(threats_table_name)
        return DynamoDBThreatModelRepository(threat_models, diagrams, components, threats)

    def _build_threats_from(self, component_id, threats_data) -> list[Threat]:
        return [Threat(
            id=t.id,
            component_id=component_id,
            name=t.name,
            stride_type=t.stride_type,
            description=t.description,
            dread_scores=DREAD(
                damage=t.dread_scores.damage,
                reproducibility=t.dread_scores.reproducibility,
                exploitability=t.dread_scores.exploitability,
                affected_users=t.dread_scores.affected_users,
                discoverability=t.dread_scores.discoverability,
            ),
            action=t.action,
            reason=t.reason,
        ) for t in threats_data]

    def get(self, threat_model_id: str) -> ThreatModel:
        try:
            threat_model_data = ThreatModelDataModel.get(threat_model_id)
        except:
            raise NotFoundException(f"ThreatModel {threat_model_id} not found")

        diagrams_data = DiagramDataModel.by_threat_model.query(threat_model_id)

        diagrams = []
        for diagram_data in diagrams_data:
            components_data = ComponentDataModel.by_diagram.query(diagram_data.id)

            components = []
            for component_data in components_data:
                threats_data = ThreatDataModel.by_component.query(component_data.id)

                threats = self._build_threats_from(component_data.id, threats_data)

                component = Component(**component_data.attribute_values, threats=threats)
                components.append(component)

            diagram = Diagram(**diagram_data.attribute_values, components=components)
            diagrams.append(diagram)

        threat_model = ThreatModel(**threat_model_data.attribute_values, diagrams=diagrams)
        print(threat_model)
        return threat_model

    def get_diagram(self, diagram_id: str) -> Diagram:
        try:
            diagram_data = DiagramDataModel.get(diagram_id)
            components_data = ComponentDataModel.by_diagram.query(diagram_data.id)

            components = [self.get_component(c.id) for c in components_data]

            return Diagram(**diagram_data.attribute_values, components=components)
        except DoesNotExist:
            raise NotFoundException(f"Diagram {diagram_id} does not exist")

    def get_component(self, component_id: str) -> Component:
        try:
            component_data = ComponentDataModel.get(component_id)
            threats_data = ThreatDataModel.by_component.query(component_id)

            threats = self._build_threats_from(component_id, threats_data)

            return Component(**component_data.attribute_values, threats=threats)
        except DoesNotExist:
            raise NotFoundException(f"Component {component_id} does not exist")

    def get_threat(self, threat_id: str) -> Threat:
        try:
            threat_data = ThreatDataModel.get(threat_id)
            params = threat_data.attribute_values
            dread_scores = params.pop("dread_scores")

            return Threat(**params, dread_scores=DREAD(
                damage=dread_scores.damage,
                reproducibility=dread_scores.reproducibility,
                exploitability=dread_scores.exploitability,
                affected_users=dread_scores.affected_users,
                discoverability=dread_scores.discoverability,
            ))
        except DoesNotExist:
            raise NotFoundException(f"Threat {threat_id} does not exist")

    def list_diagrams(self) -> list[Diagram]:
        """
        NOTE: this method does not populate components relationship
        """
        diagrams_data = DiagramDataModel.scan()
        return [Diagram(**d.attribute_values) for d in diagrams_data]

    def save(self, threat_model: ThreatModel) -> None:
        try:
            ThreatModelDataModel(**threat_model.model_dump(exclude={"diagrams"})).save()
        except ClientError as e:
            raise Exception(f"DynamoDB ClientError {e.response['Error']['Message']}")

    def save_threat(self, threat: Threat) -> None:
        try:
            ThreatDataModel(**threat.model_dump()).save()
        except ClientError as e:
            raise Exception(f"DynamoDB ClientError {e.response['Error']['Message']}")

    def save_threats(self, threats: list[Threat]) -> None:
        try:
            for threat in threats:
                self.save_threat(threat)
        except ClientError as e:
            raise Exception(f"DynamoDB ClientError {e.response['Error']['Message']}")

    def save_component(self, component: Component) -> None:
        """
        NOTE: this method does not save the threats relationship! you must save each individually
        """
        try:
            ComponentDataModel(**component.model_dump(exclude={"threats"})).save()
        except ClientError as e:
            raise Exception(f"DynamoDB ClientError {e.response['Error']['Message']}")

    def save_components(self, components: list[Component]) -> None:
        try:
            for component in components:
                self.save_component(component)
        except ClientError as e:
            raise Exception(f"DynamoDB ClientError {e.response['Error']['Message']}")

    def save_diagram(self, diagram: Diagram) -> None:
        try:
            DiagramDataModel(**diagram.model_dump(exclude={"components"})).save()
        except ClientError as e:
            raise Exception(f"DynamoDB ClientError {e.response['Error']['Message']}")

    def save_diagrams(self, diagrams: list[Diagram]) -> None:
        try:
            for diagram in diagrams:
                self.save_diagram(diagram)
        except ClientError as e:
            raise Exception(f"DynamoDB ClientError {e.response['Error']['Message']}")


    def delete(self, threat_model_id: str) -> None:
        """ Be wary of referential integrity when deleting items, you may leave zombi items without parents """
        raise NotImplementedError

    def delete_component(self, component_id: str) -> None:
        component = self.get_component(component_id)

        # we need to make sure we keep referential integrity, so we will fail deletes when there are threats associated
        # so, first let's check if there are threats
        if len(component.threats) > 0:
            raise DeleteItemException("Component has threats associated",
                                      errors=[f"Threat {t.id}" for t in component.threats])

        # if we are here it means the component has no threats and can be safely deleted
        ComponentDataModel.get(component_id).delete()

    def delete_threat(self, threat_id: str) -> None:
        ThreatDataModel.get(threat_id).delete()
