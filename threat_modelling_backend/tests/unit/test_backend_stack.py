# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import pytest
import aws_cdk as core
import aws_cdk.assertions as assertions

from backend.backend_stack import BackendStack


# example tests. To run these tests, uncomment this file along with the example
# resource in backend/backend_stack.py
@pytest.mark.skip(reason="For prototyping we do not test synth of CDK infra")
def test_sqs_queue_created():
    app = core.App()
    stack = BackendStack(app, "backend")
    template = assertions.Template.from_stack(stack)

#     template.has_resource_properties("AWS::SQS::Queue", {
#         "VisibilityTimeout": 300
#     })
