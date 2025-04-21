# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

from pydantic import BaseModel
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from mypy_boto3_bedrock_runtime.type_defs import ConverseResponseTypeDef
else:
    ConverseResponseTypeDef = object


def image_bytes(input_image_path: str) -> bytes:
    with open(input_image_path, "rb") as f:
        return f.read()


class ParseBedrockResponseMixin:
    @classmethod
    def model_validate_bedrock_response(cls: type[BaseModel], response: ConverseResponseTypeDef):
        output_message = response["output"]["message"]
        response_content_blocks = output_message["content"]

        content_block = next((block for block in response_content_blocks if "toolUse" in block), None)

        tool_use_block = content_block["toolUse"]
        tool_result_dict = tool_use_block["input"]

        # TODO: need to add some robustness here because there is no guarantee that the model will return a valid json
        return cls.model_validate(tool_result_dict)
