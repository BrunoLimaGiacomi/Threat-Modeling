// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.]
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import * as APITypes from "../API";
import { Threat } from "../API";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export type GeneratedThreatsSubscription = {
  generatedThreats?: {
    __typename: "Diagram";
    id?: string | null;
    s3Prefix?: string | null;
    userDescription?: string | null;
    diagramDescription?: string | null;
    components?: Array<{
      __typename: "Component";
      id: string;
      name: string;
      componentType: APITypes.ComponentType;
      description: string;
      threats?: Threat[] | null;
    } | null> | null;
  } | null;
};

export const generatedThreatsSubQuery = /* GraphQL */ `
  subscription GeneratedThreatsSubQuery($id: ID) {
    generatedThreats(id: $id) {
      id
      s3Prefix
      userDescription
      diagramDescription
      components {
        id
        name
        componentType
        description
        threats {
          id
          name
          description
          threatType
          dreadScores {
            damage
            reproducibility
            exploitability
            affectedUsers
            discoverability
          }
          action
          __typename
        }
        __typename
      }
      __typename
    }
  }
` as GeneratedSubscription<
  APITypes.GeneratedThreatsSubscriptionVariables,
  GeneratedThreatsSubscription
>;
