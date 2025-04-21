/* tslint:disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../API";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createDiagramDescription = /* GraphQL */ `mutation CreateDiagramDescription($diagramInput: CreateDiagramInput!) {
  createDiagramDescription(diagramInput: $diagramInput) {
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
` as GeneratedMutation<
  APITypes.CreateDiagramDescriptionMutationVariables,
  APITypes.CreateDiagramDescriptionMutation
>;
export const diagramDescription = /* GraphQL */ `mutation DiagramDescription($id: ID!, $diagramDescription: String!) {
  diagramDescription(id: $id, diagramDescription: $diagramDescription) {
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
` as GeneratedMutation<
  APITypes.DiagramDescriptionMutationVariables,
  APITypes.DiagramDescriptionMutation
>;
export const extractComponents = /* GraphQL */ `mutation ExtractComponents($extractComponentsInput: ExtractComponentsInput!) {
  extractComponents(extractComponentsInput: $extractComponentsInput) {
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
` as GeneratedMutation<
  APITypes.ExtractComponentsMutationVariables,
  APITypes.ExtractComponentsMutation
>;
export const components = /* GraphQL */ `mutation Components($id: ID!, $components: [ComponentInput]) {
  components(id: $id, components: $components) {
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
` as GeneratedMutation<
  APITypes.ComponentsMutationVariables,
  APITypes.ComponentsMutation
>;
export const generateThreats = /* GraphQL */ `mutation GenerateThreats($generateThreatsInput: GenerateThreatsInput!) {
  generateThreats(generateThreatsInput: $generateThreatsInput) {
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
` as GeneratedMutation<
  APITypes.GenerateThreatsMutationVariables,
  APITypes.GenerateThreatsMutation
>;
export const threats = /* GraphQL */ `mutation Threats($id: ID!, $components: [ComponentInput]) {
  threats(id: $id, components: $components) {
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
` as GeneratedMutation<
  APITypes.ThreatsMutationVariables,
  APITypes.ThreatsMutation
>;
export const createComponent = /* GraphQL */ `mutation CreateComponent($createComponentInput: CreateComponentInput) {
  createComponent(createComponentInput: $createComponentInput) {
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
}
` as GeneratedMutation<
  APITypes.CreateComponentMutationVariables,
  APITypes.CreateComponentMutation
>;
export const updateComponent = /* GraphQL */ `mutation UpdateComponent($updateComponentInput: UpdateComponentInput) {
  updateComponent(updateComponentInput: $updateComponentInput) {
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
}
` as GeneratedMutation<
  APITypes.UpdateComponentMutationVariables,
  APITypes.UpdateComponentMutation
>;
export const updateThreat = /* GraphQL */ `mutation UpdateThreat($updateThreatInput: UpdateThreatInput) {
  updateThreat(updateThreatInput: $updateThreatInput) {
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
}
` as GeneratedMutation<
  APITypes.UpdateThreatMutationVariables,
  APITypes.UpdateThreatMutation
>;
export const deleteComponent = /* GraphQL */ `mutation DeleteComponent($componentId: ID!) {
  deleteComponent(componentId: $componentId) {
    success
    message
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteComponentMutationVariables,
  APITypes.DeleteComponentMutation
>;
export const deleteThreat = /* GraphQL */ `mutation DeleteThreat($threatId: ID!) {
  deleteThreat(threatId: $threatId) {
    success
    message
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteThreatMutationVariables,
  APITypes.DeleteThreatMutation
>;
export const allThreatsGenerated = /* GraphQL */ `mutation AllThreatsGenerated($id: ID!) {
  allThreatsGenerated(id: $id) {
    id
    __typename
  }
}
` as GeneratedMutation<
  APITypes.AllThreatsGeneratedMutationVariables,
  APITypes.AllThreatsGeneratedMutation
>;
export const generateReport = /* GraphQL */ `mutation GenerateReport($threat_model_id: ID!) {
  generateReport(threat_model_id: $threat_model_id) {
    presignedUrl
    __typename
  }
}
` as GeneratedMutation<
  APITypes.GenerateReportMutationVariables,
  APITypes.GenerateReportMutation
>;
