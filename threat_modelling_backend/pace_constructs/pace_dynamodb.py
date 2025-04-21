# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

from aws_cdk import (
    aws_dynamodb as dynamodb,
    RemovalPolicy,
)
from constructs import Construct


class PACETable(dynamodb.Table):

    def __init__(
            self,
            scope: Construct,
            construct_id: str,
            **kwargs,
    ):
        super_kwargs = dict(
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
        )

        # override our defaults with opt-outs from user
        super_kwargs.update(kwargs)

        super().__init__(
            scope,
            construct_id,
            **super_kwargs,
        )
