# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import os

from aws_lambda_powertools.logging import Logger
from pydantic import BaseModel

DATA_BUCKET_NAME = os.environ["DATA_BUCKET_NAME"]
EXAMPLES_FOLDER = "genai_core_examples"
logger = Logger()


class Example(BaseModel):
    image_bytes: bytes
    diagram_description: str


class ExampleRetriever:
    def __init__(self, s3_client):
        self.s3_client = s3_client

    def _list_examples_in_s3_folder(self, s3_folder: str) -> list:
        try:
            objects_in_folder = self.s3_client.list_objects_v2(Prefix=s3_folder, Bucket=DATA_BUCKET_NAME)
        except Exception as e:
            logger.error({'retriever': e})
        else:
            # If list of examples is too large, S3 will truncate the response.
            #  This is very unlikely to happen as we don't expect to have many examples.
            if objects_in_folder['IsTruncated']:
                logger.warning('Response is truncated')
            if "Contents" in objects_in_folder:
                return objects_in_folder["Contents"]

            logger.warning("NO EXAMPLES FOUND!")
            return []

    def _read_s3_object(self, prefix: str, bucket_name: str = DATA_BUCKET_NAME):
        logger.info(f"Reading object {bucket_name}/{prefix}")
        s3_object = self.s3_client.get_object(Bucket=bucket_name, Key=prefix)
        return s3_object["Body"].read()

    def get_operation_examples(self, operation_name: str, bucket: str = DATA_BUCKET_NAME) -> list[Example]:
        examples = []
        # List available examples on operation folder
        examples_in_s3_path = self._list_examples_in_s3_folder(EXAMPLES_FOLDER + "/" + operation_name)

        if len(examples_in_s3_path) == 0:
            logger.error({'retriever': f'No examples found for {operation_name}'})
            return examples

        example_keys = [obj["Key"] for obj in examples_in_s3_path]
        logger.info({'retriever_examples': example_keys})

        used_examples = []
        for example_key in example_keys:
            file_type = example_key.split('.')[-1]
            if file_type != 'png' or example_key in used_examples:
                continue

            description_file_name = example_key + '.description'
            if description_file_name not in example_keys:
                logger.error(
                    {'retriever': f'Found example image but not image description found for {example_key}'})
                continue
            image = self._read_s3_object(example_key, bucket)
            description = self._read_s3_object(
                description_file_name, bucket)
            description = description.decode("utf-8")

            new_example = Example(
                image_bytes=image,
                diagram_description=description
            )

            examples.append(new_example.model_dump())
            used_examples.append(description_file_name)

        return examples
