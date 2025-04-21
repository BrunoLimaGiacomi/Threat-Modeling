# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

from functools import wraps

from aws_lambda_powertools import Metrics
from aws_lambda_powertools.metrics import MetricUnit

metrics = Metrics()


def llm_metrics(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        model_id = kwargs.get("model_id")

        response = func(*args, **kwargs)

        usage = response["usage"]
        latency_ms = response["metrics"]["latencyMs"]

        metrics.add_dimension(name="Method", value=func.__name__)

        if model_id:
            metrics.add_dimension(name="ModelId", value=model_id)

        metrics.add_metric(name="inputTokens", unit=MetricUnit.NoUnit, value=usage["inputTokens"])
        metrics.add_metric(name="outputTokens", unit=MetricUnit.NoUnit, value=usage["outputTokens"])
        metrics.add_metric(name="totalTokens", unit=MetricUnit.NoUnit, value=usage["totalTokens"])
        metrics.add_metric(name="latencyMs", unit=MetricUnit.Milliseconds, value=latency_ms)

        return response

    return wrapper
