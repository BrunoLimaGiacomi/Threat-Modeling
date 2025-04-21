# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import os

from pynamodb.models import Model
from pynamodb.attributes import UnicodeAttribute, MapAttribute, NumberAttribute
from pynamodb.indexes import GlobalSecondaryIndex, AllProjection

THREAT_MODELS_TABLE_NAME = os.getenv("THREAT_MODELS_TABLE_NAME", "ThreatModels")
DIAGRAMS_TABLE_NAME = os.getenv("DIAGRAMS_TABLE_NAME", "Diagrams")
COMPONENTS_TABLE_NAME = os.getenv("COMPONENTS_TABLE_NAME", "Components")
THREATS_TABLE_NAME = os.getenv("THREATS_TABLE_NAME", "Threats")

AWS_REGION = os.getenv("AWS_REGION",
                       "us-east-1")  # we assume the runtime will have this defined, if not, please define yourself


class ThreatModelDataModel(Model):
    class Meta:
        table_name = THREAT_MODELS_TABLE_NAME
        region = AWS_REGION

    id = UnicodeAttribute(hash_key=True)

    # name = UnicodeAttribute()


class DiagramByThreatModelIndex(GlobalSecondaryIndex):
    class Meta:
        index_name = "ByThreatModel"
        projection = AllProjection()

        read_capacity_units = 2
        write_capacity_units = 1

    threat_model_id = UnicodeAttribute(hash_key=True)
    id = UnicodeAttribute(range_key=True)


class DiagramDataModel(Model):
    class Meta:
        table_name = DIAGRAMS_TABLE_NAME
        region = AWS_REGION

    id = UnicodeAttribute(hash_key=True)
    threat_model_id = UnicodeAttribute()

    s3_prefix = UnicodeAttribute()
    user_description = UnicodeAttribute()
    diagram_description = UnicodeAttribute()
    status = UnicodeAttribute()

    by_threat_model = DiagramByThreatModelIndex()


class ComponentsByDiagramIndex(GlobalSecondaryIndex):
    class Meta:
        index_name = "ByDiagram"
        projection = AllProjection()

        read_capacity_units = 2
        write_capacity_units = 1

    diagram_id = UnicodeAttribute(hash_key=True)
    id = UnicodeAttribute(range_key=True)


class ComponentDataModel(Model):
    class Meta:
        table_name = COMPONENTS_TABLE_NAME
        region = AWS_REGION

    id = UnicodeAttribute(hash_key=True)
    diagram_id = UnicodeAttribute()

    component_type = UnicodeAttribute()
    name = UnicodeAttribute()
    description = UnicodeAttribute()

    by_diagram = ComponentsByDiagramIndex()


class DREADAttribute(MapAttribute):
    damage = NumberAttribute()
    reproducibility = NumberAttribute()
    exploitability = NumberAttribute()
    affected_users = NumberAttribute()
    discoverability = NumberAttribute()


class ThreatsByComponentIndex(GlobalSecondaryIndex):
    class Meta:
        index_name = "ByComponent"
        projection = AllProjection()

        read_capacity_units = 2
        write_capacity_units = 1

    component_id = UnicodeAttribute(hash_key=True)
    id = UnicodeAttribute(range_key=True)


class ThreatDataModel(Model):
    class Meta:
        table_name = THREATS_TABLE_NAME
        region = AWS_REGION

    id = UnicodeAttribute(hash_key=True)
    component_id = UnicodeAttribute()

    name = UnicodeAttribute()
    stride_type = UnicodeAttribute()
    description = UnicodeAttribute()

    dread_scores = DREADAttribute()
    action = UnicodeAttribute()
    reason = UnicodeAttribute()

    by_component = ThreatsByComponentIndex()
