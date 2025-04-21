# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

from aws_cdk import (
    aws_dynamodb as dynamodb,
)

from constructs import Construct

from pace_constructs import PACETable


class Database(Construct):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        """
        DISCLAIMER: This multi-table approach is highly inneficient at scale.

        We chose to use a multi-table DDB architecture for a simple reason: it's cost
        can easily scale to zero when not in use.

        If you wish to take this prototype to production, we recommend first using a proper
        relational database (it can even be serverless like an Aurora v2) and
        only when you have matured into a stable product should you then apply proper
        evolutionary architecture techniques, such as segregating read and write patterns,
        leveraging eventual consistency, or even down-right refactoring to a single-table
        DynamoDB design (see https://aws.amazon.com/blogs/compute/creating-a-single-table-design-with-amazon-dynamodb/)
        """
        super().__init__(scope, construct_id)

        self.threat_models_table = PACETable(
            self, "ThreatModels",
            partition_key=dynamodb.Attribute(name="id", type=dynamodb.AttributeType.STRING),
            # sort_key=dynamodb.Attribute(name="SK", type=dynamodb.AttributeType.STRING),
        )

        self.diagrams_table = PACETable(
            self, "Diagrams",
            partition_key=dynamodb.Attribute(name="id", type=dynamodb.AttributeType.STRING),
        )

        self.diagrams_table.add_global_secondary_index(
            index_name="ByThreatModel",
            partition_key=dynamodb.Attribute(name="threat_model_id", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="id", type=dynamodb.AttributeType.STRING),
            projection_type=dynamodb.ProjectionType.ALL,
        )

        self.components_table = PACETable(
            self, "Components",
            partition_key=dynamodb.Attribute(name="id", type=dynamodb.AttributeType.STRING),
        )

        self.components_table.add_global_secondary_index(
            index_name="ByDiagram",
            partition_key=dynamodb.Attribute(name="diagram_id", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="id", type=dynamodb.AttributeType.STRING),
            projection_type=dynamodb.ProjectionType.ALL,
        )

        self.threats_table = PACETable(
            self, "Threats",
            partition_key=dynamodb.Attribute(name="id", type=dynamodb.AttributeType.STRING),
        )

        self.threats_table.add_global_secondary_index(
            index_name="ByComponent",
            partition_key=dynamodb.Attribute(name="component_id", type=dynamodb.AttributeType.STRING),
            sort_key=dynamodb.Attribute(name="id", type=dynamodb.AttributeType.STRING),
            projection_type=dynamodb.ProjectionType.ALL,
        )

    def grant_read_data(self):
        raise NotImplementedError("You must implement this method")

    def grant_write_data(self):
        raise NotImplementedError("You must implement this method")

    def grant_read_write_data(self, grantee):
        for table in [self.threat_models_table, self.diagrams_table, self.components_table, self.threats_table]:
            table.grant_read_write_data(grantee)


    def table_names(self) -> dict:
        return {
            "THREAT_MODELS_TABLE_NAME": self.threat_models_table.table_name,
            "DIAGRAMS_TABLE_NAME": self.diagrams_table.table_name,
            "COMPONENTS_TABLE_NAME": self.components_table.table_name,
            "THREATS_TABLE_NAME": self.threats_table.table_name,
        }