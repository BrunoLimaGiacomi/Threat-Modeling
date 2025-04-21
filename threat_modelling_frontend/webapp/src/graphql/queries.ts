/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const listDiagrams = /* GraphQL */ `query ListDiagrams {
  listDiagrams {
    id
    s3Prefix
    status
    diagramDescription
    userDescription
    __typename
  }
}
` as GeneratedQuery<
  APITypes.ListDiagramsQueryVariables,
  APITypes.ListDiagramsQuery
>;
export const getDiagram = /* GraphQL */ `query GetDiagram($id: ID!) {
  getDiagram(id: $id) {
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
          __typename
        }
        action
        reason
        __typename
      }
      __typename
    }
    status
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetDiagramQueryVariables,
  APITypes.GetDiagramQuery
>;
