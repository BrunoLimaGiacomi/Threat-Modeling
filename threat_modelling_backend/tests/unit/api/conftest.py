# Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
# Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import os
import pytest
import sys

from genai_core.model import Diagram, ThreatModel, Component, Threat, DREAD

routers_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'backend/api/resolvers/main'))
sys.path.insert(0, routers_path)

@pytest.fixture
def diagram_id(faker):
    return faker.word()


@pytest.fixture
def s3_prefix(faker):
    return faker.word() + "/" + faker.word() + ".png"


@pytest.fixture
def diagram_description(faker):
    return faker.text()


@pytest.fixture
def user_description(faker):
    return faker.text()

@pytest.fixture
def threat_model(faker, diagram_id, s3_prefix, user_description, diagram_description):
    component_id = faker.word()
    return ThreatModel(id=diagram_id, diagrams=[Diagram(
        id=diagram_id,
        threat_model_id=diagram_id,
        s3_prefix=s3_prefix,
        user_description=user_description,
        diagram_description=diagram_description,
        components=[
            Component(id=component_id, diagram_id=diagram_id, name=faker.word(), description=faker.text(), component_type="DataStore",
                      threats=[
                          Threat(id=faker.word(), component_id=component_id, name=faker.word(), description=faker.text(), stride_type="Spoofing", reason="We will refactor to mitigate the risk",
                                 dread_scores=DREAD(
                                     damage=1, reproducibility=1, exploitability=1, affected_users=1, discoverability=1
                                 )),
                      ]),
        ]
    )])