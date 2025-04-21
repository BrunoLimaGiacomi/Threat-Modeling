# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

"""
This is the naïve approach of trying to get the LLM to generate a list of threats based on dynamic few shot
examples.

The idea here is to try and automate what msn did here: https://web.archive.org/web/20070303103639/http://msdn.microsoft.com/msdnmag/issues/06/11/ThreatModeling/default.aspx#S4
"""

import os
from typing import TYPE_CHECKING

from genai_core.clients import BedrockClient, ConverseModelIds
from genai_core.metrics import llm_metrics
from genai_core.model import DFDComponent, StrideType, Threats

if TYPE_CHECKING:
    from mypy_boto3_bedrock_runtime.type_defs import ConverseResponseTypeDef
else:
    ConverseResponseTypeDef = object


# We are accessing claude 3.5 cross account and using PDX region with CRIS for extra quota
BEDROCK_XACCT_ROLE = os.getenv("BEDROCK_XACCT_ROLE")
BEDROCK_CRIS_REGION = "us-west-2" if BEDROCK_XACCT_ROLE else None  # we use a client in PDX region for CRIS, otherwise we don't about region

THREATS_SCHEMA = Threats.model_json_schema()

THREATS_AS_TOOL = [{
    "toolSpec": {
        "name": THREATS_SCHEMA["title"],
        "description": THREATS_SCHEMA["description"],
        "inputSchema": {
            "json": THREATS_SCHEMA
        }
    }
}]


@llm_metrics
def get_threats_single_turn(bedrock_client, model_id, system_prompt, messages) -> ConverseResponseTypeDef:
    response = bedrock_client.converse(
        modelId=model_id.value,
        system=[{"text": system_prompt}],
        # TODO: PEAPO6WPA3ZY-14 - extract inferenceConfig to somewhere that makes more sense...
        inferenceConfig={
            "maxTokens": 4000,
            "temperature": 0,
            "stopSequences": ["\n\nHuman:"]
        },
        messages=messages,
        toolConfig={
            "tools": THREATS_AS_TOOL,
            "toolChoice": {
                "tool": {
                    "name": THREATS_SCHEMA["title"],
                }
            }
        }
    )
    return response


def generate_threats(image: bytes, diagram_description: str, dataflow_component: DFDComponent,
                     stride_type: StrideType,
                     iterations: int = 2,
                     model_id: ConverseModelIds = ConverseModelIds.CLAUDE_V3_5_SONNET_MODEL_ID) -> Threats:
    """

    :param image:
    :param diagram_description:
    :param dataflow_component:
    :param stride_type: {StrideType}
    :param iterations: {int} The number of consecutive turns we will invoke the model to ask for additional threats
    :param model_id:
    :return:
    """
    bedrock_client = BedrockClient(assumed_role=BEDROCK_XACCT_ROLE, region=BEDROCK_CRIS_REGION)

    system_prompt = (
        "You are a Security Specialist, constructing a Threat Model for an application. "
        "The user will request STRIDE threats for a specific component of the application. "
        f"You should provide an exhaustive list of {stride_type.value} threats that may affect this component. "
        "Please err on the side of caution, the user will have a chance to mark threats as false positive."
        "\n"
        "You will be given the image of the diagram, and the overall description of the architecture as a Data "
        "Flow Diagram to help in your assessment, but remember to focus on the specific component the user has "
        "presented you."
    )

    user_message = {
        "role": "user",
        "content": [
            {"image": {"format": "png", "source": {"bytes": image}}},
            {"text": diagram_description + f"""
            
Please give me an exhaustive list of {stride_type.value} threats that may affect this component:

{str(dataflow_component)}
"""},
        ]
    }

    response = get_threats_single_turn(bedrock_client, model_id, system_prompt, [user_message])

    threats = Threats.model_validate_bedrock_response(response)

    for _ in range(iterations - 1):
        messages = [
            user_message,
            {"role": "assistant", "content": [{"text": f"""
These are some potential {stride_type} threats:

{str(threats)}

Would you like more threats?
"""}]},
            {"role": "user", "content": [{"text": "Yes, please provide additional threats. Don't repeat threats you've given me before."}]},
        ]

        response = get_threats_single_turn(bedrock_client, model_id, system_prompt, messages)
        new_threats = Threats.model_validate_bedrock_response(response)
        threats = Threats(threats=threats.threats + new_threats.threats)

    return threats


def get_threats_for_component(image: bytes,
                              diagram_description: str,
                              dataflow_component: DFDComponent,
                              stride_type: str,
                              model_id: str,
                              iterations: int = 2) -> Threats:
    model_id = model_id or ConverseModelIds.CLAUDE_V3_5_SONNET_MODEL_ID.value
    threats = generate_threats(image, diagram_description, dataflow_component, StrideType(stride_type), iterations,
                               ConverseModelIds(model_id))

    return threats
