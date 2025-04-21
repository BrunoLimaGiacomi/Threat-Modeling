# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

from aws_cdk import (
    Stack,
)
from cdk_nag import NagSuppressions, NagPackSuppression
from constructs import Construct

from pace_constructs import PACECognito
from backend.api import GraphQLAPI


class BackendStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        cognito_stack = PACECognito(self, "ThreatModelUserPool", region=self.region)

        api = GraphQLAPI(self, "ThreatModel", user_pool=cognito_stack.user_pool)

        api.data_bucket.grant_read_write(cognito_stack.auth_user_role)

        NagSuppressions.add_resource_suppressions_by_path(
            stack=Stack.of(self),
            path="/BackendStack/ThreatModelUserPool/AuthenticatedUserRole/DefaultPolicy/Resource",
            suppressions=[
                NagPackSuppression(id="AwsSolutions-IAM5",
                                   reason="S3 grant_read_write method sets the wildcards as default for resource objects at S3 bucket",
                                   applies_to=[
                                       "Resource::<ThreatModelDataBucketD3863F79.Arn>/*",
                                       "Action::s3:List*",
                                       "Action::s3:GetObject*",
                                       "Action::s3:GetBucket*",
                                       "Action::s3:DeleteObject*",
                                       "Action::s3:Abort*"
                                   ]),
            ]
        )
