# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import boto3
from moto import mock_aws
import pytest


@pytest.fixture(scope="function")
def dynamodb(aws_credentials):
    with mock_aws():
        yield boto3.resource("dynamodb", region_name="us-east-1")


@pytest.fixture(scope="function")
def key_names(faker):
    return "PK", "SK"


@pytest.fixture(scope="function")
def table_names(faker):
    return "ThreatModels", "Diagrams", "Components", "Threats"


@pytest.fixture(scope="function")
def tables(dynamodb, table_names):
    threat_models_table_name, diagrams_table_name, components_table_name, threats_table_name = table_names

    dynamodb.create_table(TableName=threat_models_table_name,
                          KeySchema=[{'AttributeName': "id", 'KeyType': 'HASH'}],
                          BillingMode="PAY_PER_REQUEST",
                          AttributeDefinitions=[{'AttributeName': "id", 'AttributeType': 'S'}])

    dynamodb.create_table(TableName=diagrams_table_name,
                          KeySchema=[{'AttributeName': "id", 'KeyType': 'HASH'}],
                          BillingMode="PAY_PER_REQUEST",
                          AttributeDefinitions=[{'AttributeName': "id", 'AttributeType': 'S'},
                                                {'AttributeName': "threat_model_id", 'AttributeType': 'S'}],
                          GlobalSecondaryIndexes=[{
                              'IndexName': 'ByThreatModel',
                              'KeySchema': [
                                  {'AttributeName': "threat_model_id", 'KeyType': 'HASH'},
                                  {'AttributeName': "id", 'KeyType': 'RANGE'}
                              ],
                              'Projection': {
                                  'ProjectionType': 'ALL'
                              }
                          }])

    dynamodb.create_table(TableName=components_table_name,
                          KeySchema=[{'AttributeName': "id", 'KeyType': 'HASH'}],
                          BillingMode="PAY_PER_REQUEST",
                          AttributeDefinitions=[{'AttributeName': "id", 'AttributeType': 'S'},
                                                {'AttributeName': "diagram_id", 'AttributeType': 'S'}],
                          GlobalSecondaryIndexes=[{
                              'IndexName': 'ByDiagram',
                              'KeySchema': [
                                  {'AttributeName': "diagram_id", 'KeyType': 'HASH'},
                                  {'AttributeName': "id", 'KeyType': 'RANGE'}
                              ],
                              'Projection': {
                                  'ProjectionType': 'ALL'
                              }
                          }])

    dynamodb.create_table(TableName=threats_table_name,
                          KeySchema=[{'AttributeName': "id", 'KeyType': 'HASH'}],
                          BillingMode="PAY_PER_REQUEST",
                          AttributeDefinitions=[{'AttributeName': "id", 'AttributeType': 'S'},
                                                {'AttributeName': "component_id", 'AttributeType': 'S'}],
                          GlobalSecondaryIndexes=[{
                              'IndexName': 'ByComponent',
                              'KeySchema': [
                                  {'AttributeName': "component_id", 'KeyType': 'HASH'},
                                  {'AttributeName': "id", 'KeyType': 'RANGE'}
                              ],
                              'Projection': {
                                  'ProjectionType': 'ALL'
                              }
                          }])

    return (dynamodb.Table(table_name) for table_name in table_names)
