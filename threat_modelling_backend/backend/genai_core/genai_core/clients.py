# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

from enum import Enum
import os
from typing import Optional, TYPE_CHECKING

import boto3
from botocore.config import Config

from aws_lambda_powertools.logging import Logger

if TYPE_CHECKING:
    # mypy_boto3_* is a test-dependency only and not available at runtime
    # It is also only ever used as type-hints, so we can import it during TYPE_CHECKING only
    from mypy_boto3_bedrock_runtime.client import BedrockRuntimeClient
else:
    Table = object

logger = Logger()


class ConverseModelIds(Enum):
    CLAUDE_V3_SONNET_MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0"
    CLAUDE_V3_5_SONNET_MODEL_ID = "anthropic.claude-3-5-sonnet-20240620-v1:0"
    CLAUDE_V3_HAIKU_MODEL_ID = "anthropic.claude-3-haiku-20240307-v1:0"


class EMBEDDING_MODEL_IDS(Enum):
    TITAN_EMBED_IMAGE_V1_MODEL_ID = "amazon.titan-embed-image-v1"


def get_s3_client(region: Optional[str] = None):
    if region is None:
        target_region = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION"))
    else:
        target_region = region

    session = boto3.Session(region_name=target_region)
    return session.client("s3")


def get_bedrock_client(assumed_role: Optional[str] = None,
                       region: Optional[str] = None) -> "BedrockRuntimeClient":
    if region is None:
        target_region = os.environ.get("AWS_REGION", os.environ.get("AWS_DEFAULT_REGION"))
    else:
        target_region = region

    session_kwargs = {"region_name": target_region}
    client_kwargs = {**session_kwargs}

    retry_config = Config(
        region_name=target_region,
        connect_timeout=120,
        read_timeout=120,
        retries={
            "max_attempts": 10,
            "mode": "adaptive",
        },
    )

    session = boto3.Session(**session_kwargs)

    if assumed_role:
        logger.debug(f"  Using role: {assumed_role}")
        sts = session.client("sts", config=Config(retries={"max_attempts": 3, "mode": "adaptive"}))
        response = sts.assume_role(
            RoleArn=str(assumed_role),
            RoleSessionName="x-acct-role-for-tm-prototype"
        )

        client_kwargs["aws_access_key_id"] = response["Credentials"]["AccessKeyId"]
        client_kwargs["aws_secret_access_key"] = response["Credentials"]["SecretAccessKey"]
        client_kwargs["aws_session_token"] = response["Credentials"]["SessionToken"]

    bedrock_client = session.client(
        service_name="bedrock-runtime",
        config=retry_config,
        **client_kwargs
    )

    return bedrock_client


class RefreshCredentials:
    def __init__(descriptor, exception_descriptions=None, retries: int = 1):

        if exception_descriptions is None:
            exception_descriptions = ["ExpiredTokenException"]

        descriptor._exception_descriptions = exception_descriptions
        descriptor._retries = retries

    def __call__(descriptor, fn):
        descriptor._decorated_fn = fn

        return descriptor

    def __get__(descriptor, instance, owner=None):
        if instance is None:
            return descriptor

        def refresher(self, *args, **kwargs):
            for i in range(descriptor._retries + 1):
                try:
                    return descriptor._decorated_fn(self, *args, **kwargs)
                except Exception as ex:
                    if any(exc_desc in str(ex) for exc_desc in descriptor._exception_descriptions):
                        logger.warning(
                            f"Credentials expired when calling {descriptor._decorated_fn.__name__}. Refreshing credentials. Attempt: {i + 1}")
                        self._bedrock_client = get_bedrock_client(assumed_role=self._assumed_role, region=self._region)
                        continue
                    raise
            raise Exception(
                f"Function {descriptor._decorated_fn.__name__} failed to refresh assumed role credentials after {descriptor._retries} retries.")

        return refresher.__get__(instance, owner)


class BedrockClient:
    """
    Wrapper for Amazon Bedrock service client

    We wrap the client because we are using AssumeRole credentials which expire after 15 minutes.

    This wrapper will refresh the credentials if the calls raise an exception that matches `exception_description` and
    will retry up to `retries` times.
    """

    def __init__(self, assumed_role: Optional[str] = None, region: Optional[str] = None):
        self._assumed_role = assumed_role
        self._region = region

        self._bedrock_client = get_bedrock_client(assumed_role=assumed_role, region=region)

    @RefreshCredentials(exception_descriptions=["ExpiredTokenException"], retries=1)
    def invoke_model(self, *args, **kwargs):
        return self._bedrock_client.invoke_model(*args, **kwargs)

    @RefreshCredentials(exception_descriptions=["ExpiredTokenException"], retries=1)
    def converse(self, *args, **kwargs):
        return self._bedrock_client.converse(*args, **kwargs)

    # Delegate all remaining methods to the underlying client
    def __getattr__(self, item):
        return getattr(self._bedrock_client, item)
