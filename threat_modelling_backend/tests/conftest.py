# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import os
import pytest

CLAUDE_V3_5_SONNET_MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0"


def pytest_addoption(parser):
    parser.addoption("--model-id", action="store", default=CLAUDE_V3_5_SONNET_MODEL_ID,
                     help="The Amazon Bedrock model id for the LLM to use in tests. Default is Claude 3.5 Sonnet")


@pytest.fixture(scope="function")
def aws_credentials():
    """Mocked AWS Credentials for moto."""
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = "us-east-1"
