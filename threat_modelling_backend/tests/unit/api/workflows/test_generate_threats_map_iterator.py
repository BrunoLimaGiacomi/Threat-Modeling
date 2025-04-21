# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import os

from importlib import reload
import pytest
from unittest.mock import patch, Mock
from uuid import UUID

from genai_core.model import Threats, DFDThreat, Threat, DREAD, StrideType


@pytest.fixture(autouse=True)
def mock_notify(mock_environment):
    # sut
    from backend.api.workflows.generate_threats import index

    with patch("graphql.notifier.notify", lambda *x, **y: lambda f: f):
        reload(index)
        yield

    reload(index)


@pytest.fixture
def mock_environment(monkeypatch):
    monkeypatch.setenv("GRAPHQL_URL", "testing")
    monkeypatch.setenv("DATA_BUCKET_NAME", "test_bucket_name")


@pytest.fixture
def diagram_id(faker):
    return faker.word()


@pytest.fixture
def s3_prefix(faker):
    return faker.word() + "/" + faker.word() + ".png"


@pytest.fixture
def diagram_description(faker):
    return faker.text()


@pytest.fixture
def component_id(faker):
    return faker.word()


@pytest.fixture
def component_name(faker):
    return faker.word()


@pytest.fixture
def component_description(faker):
    return faker.text()


@pytest.fixture
def component_type(faker):
    return "DataStore"


@pytest.fixture
def component_payload(component_id, component_name, component_description, component_type):
    return {"id": component_id, "name": component_name, "description": component_description,
            "componentType": component_type}


@pytest.fixture
def threats(faker):
    return Threats(
        threats=[
            DFDThreat(
                name=faker.word(),
                description=faker.text(),
                stride_type=StrideType.SPOOFING,
                dread_scores=DREAD(
                    damage=1, reproducibility=1, exploitability=1, affected_users=1, discoverability=1
                )),
        ]
    )


# @pytest.fixture
# def component(diagram_id, component_id, component_name, component_description, component_type, threats):
#     return Component(
#         id=component_id, diagram_id=diagram_id, name=component_name, description=component_description,
#         componentType=component_type,
#         threats=threats.threats
#     )


@patch("genai_core.model.uuid4")
@patch("backend.api.workflows.generate_threats.index.write_threatmodel_as_jsonline_to_s3")
@patch("backend.api.workflows.generate_threats.index.get_threats_for_component")
@patch("backend.api.workflows.generate_threats.index.read_s3_object")
@patch("backend.api.workflows.generate_threats.index.repository")
def test_generate_threats(repo: Mock, read_s3_obj: Mock, get_threats_for_component: Mock,
                          write_threatmodel_as_jsonline_to_s3: Mock, uuid4: Mock, diagram_id, s3_prefix,
                          diagram_description, component_payload, component_id, threats):
    # we import inside the test case because we need patching in effect
    from backend.api.workflows.generate_threats.index import generate_threats

    uuid4.return_value = UUID("00000000-0000-0000-0000-000000000000")
    repo.save_threats = Mock()
    read_s3_obj.return_value = b"some binary data"
    get_threats_for_component.return_value = threats

    # when
    generate_threats({"id": diagram_id, "s3Prefix": s3_prefix, "diagramDescription": diagram_description,
                      "component": component_payload, "threatType": "Spoofing"})

    # TODO: add unit tests for notifier
    # # then, we expect that we have notified status of the generated threats

    write_threatmodel_as_jsonline_to_s3.assert_called()

    # and we also expect to have persisted a list of threats
    persisted_threats = [
        Threat(component_id=component_id, **threat.model_dump())
        for threat in threats.threats
    ]
    repo.save_threats.assert_called_with(persisted_threats)
