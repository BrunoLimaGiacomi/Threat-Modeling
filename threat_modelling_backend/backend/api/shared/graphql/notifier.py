# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import boto3
from botocore.exceptions import ClientError
from functools import wraps, cache
import os
from pydantic import BaseModel
import traceback
from typing import Callable

from aws_lambda_powertools import Logger, Metrics
from aws_lambda_powertools.metrics import MetricUnit

import requests
from requests_aws4auth import AWS4Auth

from .model import Mutation

logger = Logger()
metrics = Metrics()

GRAPHQL_URL = os.environ["GRAPHQL_URL"]


class RetryableError(Exception):
    """
    Exception raised when we know we can retry
    """
    pass


@cache
def get_aws_auth():
    aws_region = boto3.Session().region_name
    credentials = boto3.Session().get_credentials()
    service = 'appsync'
    aws_auth = AWS4Auth(
        credentials.access_key,
        credentials.secret_key,
        aws_region,
        service,
        session_token=credentials.token,
    )
    return aws_auth


def relay_error(id_: str, error_msg: str) -> None:
    """
    TODO: send an error message that shows as an alert on frontend
    """
    logger.error(f"Error while processing request with id {id_}: {error_msg}")


def relay_status(id_, query, variables):
    logger.info(f"Sending update for id {id_} and query {query[:50]}...")

    query = query.replace("\n", "")

    request = {"query": query, "variables": variables}
    logger.info(f"{request}")

    headers = {
        "Content-Type": "application/json",
    }

    response = requests.post(
        json=request,
        url=GRAPHQL_URL,
        headers=headers,
        auth=get_aws_auth(),
        timeout=10
    )
    response_json = response.json()

    logger.info({"relay_status": response_json})

    if "errors" in response_json:
        metrics.add_metric("relayStatusGraphQLErrors", unit=MetricUnit.Count, value=1.0)


# TODO: add unit tests for notifier
def notify(mutation: Mutation):
    def notify_decorator[T: BaseModel](resolver: Callable[..., T]) -> Callable[..., None]:
        @wraps(resolver)
        def notifier(*args, **kwargs):
            try:
                result: T = resolver(*args, **kwargs)
                logger.debug({"resolver result": result})

                if result is not None:
                    variables = result.model_dump(by_alias=True, include=mutation.field_set)
                    logger.debug({"field_set": mutation.field_set, "variables": variables})

                    relay_status(result.id, mutation.query, variables=variables)
            except ClientError as e:
                if e.response["Error"]["Code"] in [
                    "ThrottlingException",
                    "ServiceQuotaExceededException",
                    "ModelTimeoutException",
                    "InternalServerException",
                    "ServiceUnavailableException",
                    "ModelNotReadyException",
                    "ModelErrorException",
                ]:
                    logger.error(traceback.format_exc())
                    logger.error("GOT A RETRYABLE ERROR")
                    raise RetryableError(e)
                else:
                    # fail silently
                    logger.error(traceback.format_exc())
                    # we will fail silently because we don't implement idempotent retries in this prototype
                    if len(args) > 0 and "id" in args[0]:
                        relay_error(args[0]["id"], str(e))
            except Exception as e:
                logger.error(traceback.format_exc())
                # we will fail silently because we don't implement idempotent retries in this prototype
                if len(args) > 0 and "id" in args[0]:
                    relay_error(args[0]["id"], str(e))

        return notifier

    return notify_decorator
