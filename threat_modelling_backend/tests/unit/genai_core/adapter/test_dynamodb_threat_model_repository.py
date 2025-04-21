# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/


from boto3.dynamodb.conditions import Key

import pytest
from random import choice

from mypy_boto3_dynamodb.service_resource import Table

from genai_core.repository import DeleteItemException
from genai_core.model import ThreatModel, Diagram, Component, Threat, DREAD

# subject under test
from genai_core.adapter import DynamoDBThreatModelRepository
from genai_core.repository import NotFoundException


@pytest.fixture
def threat_model_id(faker):
    return faker.word()


# @pytest.fixture
# def diagram_id(faker):
#     return faker.word()


@pytest.fixture
def s3_prefix(faker):
    return faker.word() + "/" + faker.word() + ".png"


@pytest.fixture
def diagram_description(faker):
    return faker.text()


# @pytest.fixture
# def component_id(faker):
#     return faker.word()
#
#
# @pytest.fixture
# def threat_id(faker):
#     return faker.word()


@pytest.fixture(scope="function")
def populated_tables(tables: tuple[Table, Table, Table, Table], threat_model, s3_prefix):
    threat_models, diagrams, components, threats = tables

    threat_models.put_item(Item={"id": threat_model.id})

    for diagram in threat_model.diagrams:
        with diagrams.batch_writer() as batch:
            batch.put_item(Item={"id": diagram.id,
                                 "threat_model_id": threat_model.id,
                                 "s3_prefix": s3_prefix,
                                 "diagram_description": diagram.diagram_description,
                                 "user_description": diagram.user_description})

        for component in diagram.components:
            with components.batch_writer() as batch:
                batch.put_item(Item={"id": component.id,
                                     "diagram_id": diagram.id,
                                     "name": component.name,
                                     "description": component.description,
                                     "component_type": component.component_type})

            for threat in component.threats:
                with threats.batch_writer() as batch:
                    batch.put_item(Item={"id": threat.id,
                                         "component_id": component.id,
                                         "name": threat.name,
                                         "description": threat.description,
                                         "stride_type": threat.stride_type,
                                         "action": threat.action,
                                         "reason": threat.reason,
                                         "dread_scores": {
                                             "damage": threat.dread_scores.damage,
                                             "reproducibility": threat.dread_scores.reproducibility,
                                             "exploitability": threat.dread_scores.exploitability,
                                             "affected_users": threat.dread_scores.affected_users,
                                             "discoverability": threat.dread_scores.discoverability,
                                         }})

    return threat_models, diagrams, components, threats


# Model fixtures

@pytest.fixture
def threat_model(faker, threat_model_id, diagram_description, s3_prefix):
    diagram_id = faker.word()
    component_id = faker.word()

    return ThreatModel(id=threat_model_id, diagrams=[Diagram(
        id=diagram_id,
        threat_model_id=threat_model_id,
        s3_prefix=s3_prefix,
        diagram_description=diagram_description,
        components=[
            Component(id=component_id, diagram_id=diagram_id, name=faker.word(), description=faker.text(), component_type="DataStore",
                      threats=[
                          Threat(id=faker.word(), component_id=component_id, name=faker.word(), description=faker.text(), stride_type="Spoofing",
                                 action="Not Applicable", reason=faker.text(),
                                 dread_scores=DREAD(
                                     damage=1, reproducibility=1, exploitability=1, affected_users=1, discoverability=1
                                 )),
                      ]),
        ]
    )])


@pytest.fixture
def repo(table_names):
    threat_models_table_name, diagrams_table_name, components_table_name, threats_table_name = table_names

    return DynamoDBThreatModelRepository.from_table_names(threat_models_table_name, diagrams_table_name,
                                                          components_table_name, threats_table_name)


def test_repo_can_get_threat_model(populated_tables: tuple[Table, Table, Table, Table], repo, threat_model):
    # when
    retrieved_threat_model = repo.get(threat_model.id)

    # then
    assert retrieved_threat_model == threat_model


def test_repo_can_get_diagram(populated_tables: tuple[Table, Table, Table, Table], repo, threat_model):
    # given
    diagram = threat_model.diagrams[0]

    # when
    retrieved_diagram = repo.get_diagram(diagram.id)

    # then
    assert retrieved_diagram == diagram


def test_repo_can_get_component(populated_tables: tuple[Table, Table, Table, Table], repo, key_names, threat_model):
    # given
    diagram = threat_model.diagrams[0]
    component = diagram.components[0]

    # when
    retrieved_component = repo.get_component(component.id)

    assert retrieved_component == component


def test_repo_can_get_threat(populated_tables: Table, repo, threat_model):
    # given
    diagram = threat_model.diagrams[0]
    component = diagram.components[0]
    threat = component.threats[0]

    # when
    retrieved_threat = repo.get_threat(threat.id)

    assert retrieved_threat == threat


def test_repo_raises_when_not_found(faker, tables, repo):
    a_nonexistent_threat_model_id = faker.word()
    with pytest.raises(NotFoundException, match=f"ThreatModel {a_nonexistent_threat_model_id} not found") as e:
        repo.get(a_nonexistent_threat_model_id)


def test_repo_can_list_diagrams(populated_tables, repo, threat_model):
    retrieved_diagrams = repo.list_diagrams()

    assert len(retrieved_diagrams) == len(threat_model.diagrams)
    assert [d.id for d in retrieved_diagrams] == [d.id for d in threat_model.diagrams]


def test_repo_can_save_diagrams(tables, repo, threat_model):
    # when
    repo.save(threat_model)
    repo.save_diagrams(threat_model.diagrams)
    repo.save_components([c for d in threat_model.diagrams for c in d.components])
    repo.save_threats([t for d in threat_model.diagrams for c in d.components for t in c.threats])

    # then
    persisted_threat_model = repo.get(threat_model.id)

    assert persisted_threat_model == threat_model


def test_repo_can_save_components(tables, repo, threat_model):
    components = [
        c for d in threat_model.diagrams for c in d.components
    ]

    # when
    repo.save_components(components)

    # then
    persisted_components = [
        repo.get_component(c.id) for d in threat_model.diagrams for c in d.components
    ]

    assert len(persisted_components) == len(components)
    for persisted_component in persisted_components:
        matching_component = next(c for c in components if c.id == persisted_component.id)
        assert persisted_component.id == matching_component.id
        # assert persisted_component == matching_component


def test_repo_can_save_threats(tables: tuple[Table, Table, Table, Table], repo, threat_model):
    # given
    diagram = threat_model.diagrams[0]
    component = diagram.components[0]

    # let's assert the db does not have our threats
    for threat in component.threats:
        with pytest.raises(NotFoundException):
            repo.get_threat(threat.id)

    # now, when we save our threats
    repo.save_threats(component.threats)

    # then, we should be able to retrieve them back
    saved_threats = [repo.get_threat(t.id) for t in component.threats]

    assert len(saved_threats) == len(component.threats)
    for threat in component.threats:
        saved_threat = next(t for t in saved_threats if t.id == threat.id)
        assert saved_threat == threat


def test_repo_can_delete_threat(populated_tables, repo, threat_model):
    # given
    diagram = threat_model.diagrams[0]
    component = diagram.components[0]
    threat = component.threats[0]

    # first let's assert the populated table has our threat, it will throw if it doesn't, so we don't need to assert
    existing_threat = repo.get_threat(threat.id)

    # when
    repo.delete_threat(threat.id)

    # then
    with pytest.raises(NotFoundException, match=f"Threat {threat.id} does not exist"):
        repo.get_threat(threat.id)


def test_repo_delete_raises_exception_when_component_has_threats(populated_tables, repo, threat_model):
    # given
    diagram = threat_model.diagrams[0]
    component = diagram.components[0]
    threat = component.threats[0]

    # when
    with pytest.raises(DeleteItemException, match="Component has threats associated") as exc:
        repo.delete_component(component.id)

    exception = exc.value
    assert len(exception.errors) == len(component.threats)
    assert any(threat.id in err_msg for err_msg in exception.errors)


def test_repo_can_delete_component_when_it_has_no_threats(populated_tables, repo, threat_model):
    # given
    diagram = threat_model.diagrams[0]
    component = diagram.components[0]

    # let's first delete all threats
    for threat in component.threats:
        repo.delete_threat(threat.id)

    # Now we can trigger our SUT
    repo.delete_component(component.id)

    # Then, it should no longer be in our populated table
    with pytest.raises(NotFoundException, match=f"Component {component.id} does not exist"):
        repo.get_component(component.id)


def test_repo_can_update_component(populated_tables, repo, threat_model, faker):
    # given
    diagram = threat_model.diagrams[0]
    component = diagram.components[0]

    a_name = faker.word()
    a_description = faker.text()
    a_component_type = choice(
        [t for t in ["Actor", "ExternalEntity", "DataStore", "Process", "DataFlow", "TrustBoundary"] if
         t != component.component_type])

    updated_component = component.model_copy(
        update={"name": a_name, "description": a_description, "componentType": a_component_type})

    # when
    repo.save_component(updated_component)

    # then
    persisted_updated_component = repo.get_component(updated_component.id)

    assert persisted_updated_component == updated_component
