# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import boto3
from time import time
from moto import mock_aws
import pytest
import re
from unittest.mock import patch, Mock


@pytest.fixture(autouse=True)
def mock_environment(monkeypatch, bucket_name):
    monkeypatch.setenv("DATA_BUCKET_NAME", bucket_name)


@pytest.fixture(scope="function")
def s3(aws_credentials):
    with mock_aws():
        yield boto3.client("s3", region_name="us-east-1")


@pytest.fixture
def bucket_name():
    # TECH DEBT: env mocking is leaking and is preventing us from using a random bucket name
    return "test_bucket_name"


@pytest.fixture
def bucket(s3, bucket_name):
    s3.create_bucket(Bucket=bucket_name)


@patch("backend.api.resolvers.main.routers.sync_resolvers.repository")
def test_generate_report(repository: Mock, bucket, s3, bucket_name, threat_model, aws_credentials):
    from backend.api.resolvers.main.routers.sync_resolvers import generate_report

    # given
    repository.get = Mock(return_value=threat_model)

    # when
    report = generate_report(threat_model.id)

    presigned_url = report["presignedUrl"]

    # then we expect a presigned url to have been generated
    assert re.match(fr"https://s3.amazonaws.com/{bucket_name}/reports/\d{{4}}-\d{{2}}-\d{{2}}_\d{{2}}-\d{{2}}-{threat_model.id}.xlsx\?AWSAccessKeyId", presigned_url)

    # let's also assert that the expiration is the expected one
    expires_in = 3600  # number of seconds from now to expire the link

    expires_match = re.search(r"Expires=(\d+)", presigned_url)
    assert expires_match, f"Could not find expiration on presigned url {presigned_url}"

    expiration = expires_match.group(1)

    current_ts = int(time())

    assert pytest.approx(current_ts + expires_in, expiration, abs=5)



