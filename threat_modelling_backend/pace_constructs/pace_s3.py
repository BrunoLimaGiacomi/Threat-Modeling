# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

from aws_cdk import (
    aws_s3 as s3,
    Duration,
    RemovalPolicy,
)
from constructs import Construct


class PACEBucket(s3.Bucket):

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs,
    ):
        super_kwargs = {
            "versioned": True,
            "auto_delete_objects": True,
            "removal_policy": RemovalPolicy.DESTROY,
            "object_ownership": s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
            "block_public_access": s3.BlockPublicAccess(
                block_public_acls=True,
                block_public_policy=True,
                ignore_public_acls=True,
                restrict_public_buckets=True,
            ),
            "encryption": s3.BucketEncryption.S3_MANAGED,
            "enforce_ssl": True,
            "lifecycle_rules": [
                s3.LifecycleRule(enabled=True, expiration=Duration.days(90)),
            ],
            "server_access_logs_prefix": "logs/",
            "cors": [
                s3.CorsRule(
                    allowed_methods=[
                        s3.HttpMethods.GET,
                        s3.HttpMethods.HEAD,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.POST,
                    ],
                    allowed_origins=["*"],
                    allowed_headers=["*"],
                    exposed_headers=[
                        "x-amz-server-side-encryption",
                        "x-amz-request-id",
                        "x-amz-id-2",
                        "ETag",
                    ],
                    max_age=3000,
                )
            ],
        }

        super_kwargs.update(kwargs)
        super().__init__(
            scope,
            construct_id,
            **super_kwargs,
        )
