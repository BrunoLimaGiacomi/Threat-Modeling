// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.]
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { Threat } from "./API";

export type ThreatWithComponentId = Omit<Threat, "__typename"> & {
  componentId: string;
};

export type ComponentThreatAction = {
  componentId: string;
  threatId: string;
  action: string;
  reason: string;
};

export enum ThreatAction {
  Mitigate = "Mitigate",
  Avoid = "Avoid",
  Transfer = "Transfer",
  AcceptIgnore = "AcceptIgnore",
  NotApplicable = "NotApplicable",
}
