# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import boto3
from moto import mock_aws
import pytest


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
def example_files():
    return "image.png", "image.png.description"


@pytest.fixture
def operation_name(faker):
    return faker.word()


@pytest.fixture
def bucket(s3, bucket_name):
    s3.create_bucket(Bucket=bucket_name)


@pytest.fixture()
def populated_bucket(s3, bucket, bucket_name, example_files, operation_name):
    image, description = example_files

    s3.put_object(Bucket=bucket_name, Key=f"genai_core_examples/{operation_name}/{image}", Body=b"data")
    s3.put_object(Bucket=bucket_name, Key=f"genai_core_examples/{operation_name}/{description}", Body=b"description")


def test_example_retriever(s3, operation_name, populated_bucket):
    from genai_core.example_retriever import ExampleRetriever

    # given
    examples_retriever = ExampleRetriever(s3_client=s3)

    # when
    results = examples_retriever.get_operation_examples(operation_name=operation_name)

    # then
    assert len(results) > 0
    assert results == [
        {"image_bytes": b"data", "diagram_description": "description"}
    ]
    # assert 1 == 2


def test_example_retriever_when_no_objects_are_found(s3, bucket, operation_name):
    from genai_core.example_retriever import ExampleRetriever

    # given
    examples_retriever = ExampleRetriever(s3_client=s3)

    # when
    results = examples_retriever.get_operation_examples(operation_name=operation_name)

    # then
    assert len(results) == 0


def test_example_retriever_when_there_are_missing_objects(s3, bucket, bucket_name, example_files, operation_name):
    """
    We always expect examples to be in pairs: an image file and a description.
    """
    from genai_core.example_retriever import ExampleRetriever

    # given
    image, _ = example_files
    s3.put_object(Bucket=bucket_name, Key=f"genai_core_examples/{operation_name}/{image}", Body=b"data")

    examples_retriever = ExampleRetriever(s3_client=s3)

    # when
    results = examples_retriever.get_operation_examples(operation_name=operation_name)

    # then, we expect an empty list because we ignore missing pairs
    assert len(results) == 0


def test_example_retriever_when_there_are_multiple_examples(s3, populated_bucket, bucket_name, operation_name):
    """
    We always expect examples to be in pairs: an image file and a description.
    """
    from genai_core.example_retriever import ExampleRetriever

    # given
    another_image, another_description = "other.png", "other.png.description"

    s3.put_object(Bucket=bucket_name, Key=f"genai_core_examples/{operation_name}/{another_image}", Body=b"another_data")
    s3.put_object(Bucket=bucket_name, Key=f"genai_core_examples/{operation_name}/{another_description}",
                  Body=b"another_description")

    examples_retriever = ExampleRetriever(s3_client=s3)

    # when
    results = examples_retriever.get_operation_examples(operation_name=operation_name)

    # then, we expect an empty list because we ignore missing pairs
    assert len(results) == 2
    assert results == [
        {"image_bytes": b"data", "diagram_description": "description"},
        {"image_bytes": b"another_data", "diagram_description": "another_description"}
    ]
