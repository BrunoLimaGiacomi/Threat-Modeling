# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

from importlib import reload
from random import choice

import pytest
from unittest.mock import patch, Mock

from genai_core.clients import ConverseModelIds


@pytest.fixture
def mock_environment(monkeypatch):
    monkeypatch.setenv("DATA_BUCKET_NAME", "test_bucket_name")


@pytest.fixture(autouse=True)
def mock_llm_metrics(mock_environment):
    from genai_core import diagram_describer

    with patch("genai_core.metrics.llm_metrics", lambda f: f):
        reload(diagram_describer)
        yield

    reload(diagram_describer)


@pytest.fixture
def converse_text_response():
    def _from_text(text):
        return {
            "output": {
                "message": {
                    "role": "assistant",
                    "content": [
                        {
                            "text": text
                        }
                    ]
                }
            }
        }

    return _from_text


@pytest.fixture
def model_id():
    return choice(list(ConverseModelIds))


@patch("genai_core.diagram_describer.ExampleRetriever")
@patch("genai_core.diagram_describer.get_bedrock_client")
def test_describe_diagram_raises_when_no_examples_are_provided(get_bedrock_client: Mock, ExampleRetriever: Mock,
                                                               converse_text_response):
    from genai_core.diagram_describer import describe_diagram

    # given
    ExampleRetriever.return_value.get_operation_examples.return_value = []

    # then, we expect that we raise an exception because we need examples!
    with pytest.raises(Exception, match="Expected at least one example!"):
        describe_diagram(image=b"data")


@patch("genai_core.diagram_describer.ExampleRetriever")
@patch("genai_core.diagram_describer.get_bedrock_client")
def test_describe_diagram_can_use_example_retriever(get_bedrock_client: Mock, ExampleRetriever: Mock, model_id):
    from genai_core.diagram_describer import describe_diagram

    # given
    some_examples = [{"image_bytes": b"data", "diagram_description": "some_description"}]
    bedrock_client = Mock()
    get_bedrock_client.return_value = bedrock_client
    ExampleRetriever.return_value.get_operation_examples.return_value = some_examples

    # when
    describe_diagram(image=b"data", model_id=model_id)

    # then
    args, kwargs = bedrock_client.converse.call_args
    assert kwargs["modelId"] == model_id.value
    assert len(kwargs["messages"]) == 3  # a pair or user+assistant for the example + the final user message
    assert kwargs["messages"][1]["content"][0]["text"] == some_examples[0]["diagram_description"]
