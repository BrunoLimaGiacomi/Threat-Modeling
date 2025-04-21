# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import os
from typing import TYPE_CHECKING

from aws_lambda_powertools import Logger

from genai_core.clients import get_bedrock_client, ConverseModelIds, get_s3_client
from genai_core.metrics import llm_metrics
from genai_core.example_retriever import ExampleRetriever

if TYPE_CHECKING:
    from mypy_boto3_bedrock_runtime.type_defs import ConverseResponseTypeDef
else:
    ConverseResponseTypeDef = object

# We are accessing claude 3.5 cross account and using PDX region with CRIS for extra quota
BEDROCK_XACCT_ROLE = os.getenv("BEDROCK_XACCT_ROLE")
BEDROCK_CRIS_REGION = "us-west-2" if BEDROCK_XACCT_ROLE else None  # we use a client in PDX region for CRIS, otherwise we don't about region

logger = Logger()

DIAGRAM_DESCRIBER_PROMPT = """ 
<threat-model>
Threat modeling is the process of using hypothetical scenarios, system diagrams, and testing to help secure systems and data. By identifying vulnerabilities, helping with risk assessment, and suggesting corrective action, threat modeling helps improve cybersecurity and trust in key business systems.
</threat-model>

<description-guidelines>
- The High Level description should be as detailed and exhaustive as possible
- Be very detailed and specific; Do not summarize or generalize 
- Components should be detailed and should belong to any of the types: Actors, External Entities, Data Stores, Processes, Data Flows and Trust Boundaries
- If cannot find components of a certain type, list the type and indicate that no explicit components were found
- For each component, extract its name, description, component type, and how it interacts in the diagram
- Pay special attention to data flows. List all possible data flows, including those that might seem minor or implicit. Each flow should have a clear source, destination, and description of what is being transferred
- For each component, provide a detailed description of its possible function, its interactions with other components, and any potential security implications
- When describing dataflow indicate the type of component each one is eg. From External entity "A" to process "B"
- Trust boundaries should specify trust relation between components eg. Between external entity "A" and datastore "C". Explain the significance of each boundary in terms of security and data protection
- Carefully identify and describe all trust boundaries, including implicit ones. 
- Use the exact names of components as they appear in the diagram. If abbreviations or technical terms are used,try to explain them
- Present your description in a structured, numbered format for easy reference during the threat modeling process</description-guidelines>

<user_description>{user_description}</user_description>

You are a security expert at an IT Security Office of an important company. 
You are assigned the initial stage of the security process, this stage consist of creating an initial version of a threat model from 
architectural diagrams of the company applications. You can find a definition of a threat model at <threat-model>

Your task is to write a detailed description of the architecture diagram provided, <user_description> might be provided in some cases where the user can provide additional contex of the diagram to assess.
If available, use the user description <user_description> to enrich your results for each section. 
 The description you write needs to capture every single component type (which can be any of Actors, External Entities, Data Stores, Processes, Data Flows and Trust Boundaries), get its name and how each component interconnects. \n\n 
 Gather as much detail as possible, your results will later be used to create a data flow diagram for a threat model. 
. \n\n You will be provided with examples below that you should follow to format your response. ")"""

DIAGRAM_DESCRIBER_OPERATION_NAME = 'diagram_describer'


@llm_metrics
def describe_diagram(image: bytes, model_id: ConverseModelIds = ConverseModelIds.CLAUDE_V3_5_SONNET_MODEL_ID,
                     user_description: str = "") -> ConverseResponseTypeDef:
    if BEDROCK_XACCT_ROLE:
        bedrock_client = get_bedrock_client(assumed_role=BEDROCK_XACCT_ROLE, region=BEDROCK_CRIS_REGION)
    else:
        bedrock_client = get_bedrock_client()

    example_retriever = ExampleRetriever(get_s3_client())
    examples = example_retriever.get_operation_examples(operation_name=DIAGRAM_DESCRIBER_OPERATION_NAME)

    # These are the few shot examples we will use
    example_messages = [[
        {
            "role": "user",
            "content": [
                {
                    "image": {
                        "format": 'png',
                        "source": {
                            "bytes": example["image_bytes"]
                        }
                    }
                }
            ]
        },
        {
            "role": "assistant",
            "content": [
                {"text": example["diagram_description"]}
            ]
        }]
        for example in examples
    ]
    # we need to flatten examples_messages before we pass it into our converse model
    example_messages = [i for pair in example_messages for i in pair]

    if len(example_messages) == 0:
        raise Exception("Expected at least one example!")

    if user_description == "":
        system_prompt = DIAGRAM_DESCRIBER_PROMPT.replace("<user_description>{user_description}</user_description>", "")
    else:
        system_prompt = DIAGRAM_DESCRIBER_PROMPT.format(user_description=user_description)

    logger.info({"prompt": system_prompt})

    response = bedrock_client.converse(
        modelId=model_id.value,
        system=[{"text": system_prompt}],
        # TODO: PEAPO6WPA3ZY-14 - extract inferenceConfig to somewhere that makes more sense...
        inferenceConfig={
            "maxTokens": 4000,
            "temperature": 0,
            "stopSequences": ["\n\nHuman:"]
        },
        messages=example_messages + [{
            "role": "user",
            "content": [
                {
                    "image": {
                        "format": 'png',
                        "source": {
                            "bytes": image
                        }
                    }
                }
            ]
        }]
    )

    logger.info({"bedrock_response": response})

    return response


def get_diagram_description(image: bytes, model_id: str, user_description: str = ""):
    model_id = model_id or ConverseModelIds.CLAUDE_V3_5_SONNET_MODEL_ID
    response = describe_diagram(image, ConverseModelIds(model_id), user_description)

    output_message = response["output"]["message"]
    output_message_content = "\n".join([content["text"] for content in output_message["content"]])

    return output_message_content
