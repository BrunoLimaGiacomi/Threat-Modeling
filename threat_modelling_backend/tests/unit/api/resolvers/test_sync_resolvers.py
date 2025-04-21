# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import pytest
from random import choice
from typing import Optional
from unittest.mock import patch, Mock

from genai_core.repository import DeleteItemException
from genai_core.model import Diagram, Component, Threat


@pytest.fixture
def component_type_different_from():
    def _component_type_different_from(this_type: Optional[str] = None):
        return choice(
            [t for t in ["Actor", "ExternalEntity", "DataStore", "Process", "DataFlow", "TrustBoundary"] if
             t != this_type])

    return _component_type_different_from


@patch("backend.api.resolvers.main.routers.sync_resolvers.repository")
def test_get_diagram_resolver(repo: Mock, diagram_id, s3_prefix, threat_model):
    from backend.api.resolvers.main.routers.sync_resolvers import get_diagram

    # given
    diagram = threat_model.diagrams[0]
    repo.get = Mock(return_value=threat_model)

    # when
    diagram_dict = get_diagram(diagram_id)

    # then
    assert diagram_dict == {
        "id": diagram_id,
        "threat_model_id": threat_model.id,
        "userDescription": diagram.user_description,
        "s3Prefix": s3_prefix,
        "diagramDescription": diagram.diagram_description,
        "status": "NA",
        "components": [{
            "id": c.id, "diagram_id": diagram_id, "name": c.name, "description": c.description,
            "componentType": c.component_type,
            "threats": [{
                "id": t.id, "component_id": c.id, "name": t.name, "description": t.description,
                "threatType": t.stride_type,
                "action": "Mitigate", "reason": "We will refactor to mitigate the risk",
                "dreadScores": {
                    "damage": t.dread_scores.damage,
                    "reproducibility": t.dread_scores.reproducibility,
                    "exploitability": t.dread_scores.exploitability,
                    "affectedUsers": t.dread_scores.affected_users,
                    "discoverability": t.dread_scores.discoverability,
                }
            } for t in c.threats]
        } for c in diagram.components]
    }


@patch("backend.api.resolvers.main.routers.sync_resolvers.repository")
def test_delete_component_resolver(repo: Mock, faker):
    from backend.api.resolvers.main.routers.sync_resolvers import delete_component

    # given
    repo.delete_component = Mock()

    a_component_id = faker.word()

    # when
    result = delete_component(a_component_id)

    # then
    assert result == {"success": True, "message": f"Component {a_component_id} deleted successfully"}


@patch("backend.api.resolvers.main.routers.sync_resolvers.repository")
def test_delete_component_resolver_warns_when_cant_delete_component(repo: Mock, faker):
    from backend.api.resolvers.main.routers.sync_resolvers import delete_component

    # given
    an_error_message = "An error message"
    a_list_of_errors = ["Foo", "Bar"]
    repo.delete_component = Mock(side_effect=DeleteItemException(an_error_message, errors=a_list_of_errors))

    a_component_id = faker.word()

    # when
    result = delete_component(a_component_id)

    # then
    assert result == {"success": False,
                      "message": f"{an_error_message} - Threats belonging to component {a_component_id}: {' | '.join(a_list_of_errors)}"}


@patch("backend.api.resolvers.main.routers.sync_resolvers.repository")
def test_delete_threat_resolver(repo: Mock, faker):
    from backend.api.resolvers.main.routers.sync_resolvers import delete_threat

    # given
    repo.delete_component = Mock()

    a_threat_id = faker.word()

    # when
    result = delete_threat(a_threat_id)

    # then
    assert result == {"success": True, "message": f"Threat {a_threat_id} deleted successfully"}


@patch("backend.api.resolvers.main.routers.sync_resolvers.repository")
def test_list_diagrams_resolver(repo: Mock, diagram_id, s3_prefix, diagram_description,
                                user_description):
    from backend.api.resolvers.main.routers.sync_resolvers import list_diagrams

    a_status = choice(["NA", "THREATS_GENERATED", "GENERATING_THREATS"])

    # given
    diagrams = [
        Diagram(id=diagram_id, threat_model_id=diagram_id, s3_prefix=s3_prefix, diagram_description=diagram_description,
                user_description=user_description, status=a_status),
    ]
    repo.list_diagrams = Mock(return_value=diagrams)

    # when
    result = list_diagrams()

    # then
    assert result == [
        {"components": [], "diagramDescription": diagram_description, "id": diagram_id, "threat_model_id": diagram_id,
         "userDescription": user_description, "s3Prefix": s3_prefix, "status": a_status}]


@patch("backend.api.resolvers.main.routers.sync_resolvers.repository")
def test_update_component_resolver(repo: Mock, threat_model, faker, component_type_different_from):
    from backend.api.resolvers.main.routers.sync_resolvers import update_component

    # given
    diagram = threat_model.diagrams[0]
    component = diagram.components[0]

    a_new_name = faker.word()
    a_new_description = faker.text()
    a_new_component_type = component_type_different_from(component.component_type)

    repo.get_component = Mock(return_value=component)
    repo.save_component = Mock()

    # when
    updated_component = update_component(
        {"id": threat_model.id, "diagramId": diagram.id, "componentId": component.id,
         "name": a_new_name, "description": a_new_description, "componentType": a_new_component_type})

    # then
    component_dict = component.model_dump(by_alias=True)
    differences = {k: (component_dict[k], updated_component[k]) for k in component_dict if
                   component_dict[k] != updated_component[k]}

    assert len(differences) == 3
    assert differences["name"] == (component.name, a_new_name)
    assert differences["description"] == (component.description, a_new_description)
    assert differences["componentType"] == (component.component_type, a_new_component_type)

    repo.save_component.assert_called_with(Component(**updated_component))


@patch("backend.api.resolvers.main.routers.sync_resolvers.repository")
def test_update_threat_resolver(repo: Mock, threat_model, faker):
    from backend.api.resolvers.main.routers.sync_resolvers import update_threat

    # given
    diagram = threat_model.diagrams[0]
    component = diagram.components[0]
    threat = component.threats[0]

    a_new_name = faker.word()
    a_new_description = faker.text()
    a_new_threat_type = choice([t for t in ["Tampering", "Repudiation"] if t != threat.stride_type])
    a_new_action = choice([a for a in ["Mitigate", "Avoid", "Transfer"] if a != threat.action])
    a_reason = faker.text()

    repo.get_threat = Mock(return_value=threat)
    repo.save_threat = Mock()

    # when
    updated_threat = update_threat(
        {"id": threat_model.id, "diagramId": diagram.id, "componentId": component.id, "threatId": threat.id,
         "name": a_new_name, "description": a_new_description, "threatType": a_new_threat_type, "action": a_new_action,
         "reason": a_reason})

    # then
    threat_dict = threat.model_dump(by_alias=True)
    differences = {k: (threat_dict[k], updated_threat[k]) for k in threat_dict if threat_dict[k] != updated_threat[k]}

    assert differences["name"] == (threat.name, a_new_name)
    assert differences["description"] == (threat.description, a_new_description)
    assert differences["threatType"] == (threat.stride_type, a_new_threat_type)
    assert differences["action"] == (threat.action, a_new_action)
    assert differences["reason"] == (threat.reason, a_reason)

    repo.save_threat.assert_called_with(Threat(**updated_threat))


@patch("backend.api.resolvers.main.routers.sync_resolvers.repository")
def test_create_component_resolver(repo: Mock, threat_model, component_type_different_from, faker):
    from backend.api.resolvers.main.routers.sync_resolvers import create_component

    # given
    diagram = threat_model.diagrams[0]

    a_name = faker.word()
    a_description = faker.text()
    a_component_type = component_type_different_from()

    # when
    create_component({"id": threat_model.id, "diagramId": diagram.id, "name": a_name, "description": a_description,
                      "componentType": a_component_type})

    # then
    args, kwargs = repo.save_component.call_args
    component = args[0]
    assert component.name == a_name
    assert component.description == a_description
    assert component.component_type == a_component_type
