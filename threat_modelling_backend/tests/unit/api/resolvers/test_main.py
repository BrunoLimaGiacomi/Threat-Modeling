# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

from importlib import reload
import pytest
from unittest.mock import patch, Mock

from genai_core.model import Diagram, DFD, DFDComponent, ThreatModel, Component


@pytest.fixture
def mock_notify(mock_environment):
    # sut
    from backend.api.resolvers.main import index

    with patch("graphql.notifier.notify", lambda *x, **y: lambda f: f):
        reload(index)
        yield

    reload(index)


@pytest.fixture
def mock_environment(monkeypatch):
    monkeypatch.setenv("GRAPHQL_URL", "testing")
    monkeypatch.setenv("DATA_BUCKET_NAME", "test_bucket_name")


@pytest.fixture
def dfd(faker):
    return DFD(components=[
        DFDComponent(id=faker.word(), diagram_id=faker.word(), name=faker.word(), description=faker.text(),
                     component_type="DataStore"),
    ])


@patch("backend.api.resolvers.main.index.get_diagram_description")
@patch("backend.api.resolvers.main.index.read_s3_object")
@patch("backend.api.resolvers.main.index.repository")
def test_create_diagram_description_resolver(repo: Mock, read_s3_obj: Mock, get_diagram_description: Mock, diagram_id,
                                             s3_prefix, diagram_description, mock_notify):
    # we import inside the test case because we need patching in effect
    from backend.api.resolvers.main.index import create_diagram

    repo.save = Mock()
    some_binary_data = b"some binary data"
    read_s3_obj.return_value = some_binary_data
    get_diagram_description.return_value = diagram_description

    # when
    create_diagram({"id": diagram_id, "s3Prefix": s3_prefix})

    # TODO: add unit tests for notifier
    # # then, we expect that we have relayed status of the created diagram
    # relay_status.assert_called_with(diagram_id, DiagramDescriptionMutation.query,
    #                                 variables={"id": diagram_id, "diagramDescription": diagram_description})

    # and we also expect to have persisted the result
    repo.save_diagram.assert_called_with(
        Diagram(id=diagram_id, threat_model_id=diagram_id, s3_prefix=s3_prefix,
                diagram_description=diagram_description))


@patch("backend.api.resolvers.main.index.get_dfd_from_diagram_and_description")
@patch("backend.api.resolvers.main.index.read_s3_object")
@patch("backend.api.resolvers.main.index.repository")
def test_extract_components_resolver(repo: Mock, read_s3_obj: Mock, get_dfd_from_diagram_and_description: Mock,
                                     diagram_id, s3_prefix, diagram_description, dfd, mock_notify):
    # we import inside the test case because we need patching in effect
    from backend.api.resolvers.main.index import extract_components

    repo.save = Mock()
    read_s3_obj.return_value = b"some binary data"
    get_dfd_from_diagram_and_description.return_value = dfd

    # when
    diagram_with_components = extract_components(
        {"id": diagram_id, "s3Prefix": s3_prefix, "diagramDescription": diagram_description})

    # TODO: add unit tests for notifier
    # # then, we expect that we have relayed status of the extracted components
    # relay_status.assert_called_with(diagram_id, ComponentsMutation.query,
    #                                 variables={"id": diagram_id,
    #                                            "components": [
    #                                                {"id": c.id, "name": c.name, "description": c.description,
    #                                                 "componentType": c.component_type}
    #                                                for c in dfd.components]})

    # and we also expect to have persisted the result
    repo.save_components.assert_called_with([Component(
        id=c.id, diagram_id=diagram_id, name=c.name, description=c.description, component_type=c.component_type
    ) for c in dfd.components])
