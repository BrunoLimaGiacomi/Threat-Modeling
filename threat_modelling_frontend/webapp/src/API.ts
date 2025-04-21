/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type Diagram = {
  __typename: "Diagram",
  id?: string | null,
  s3Prefix?: string | null,
  userDescription?: string | null,
  diagramDescription?: string | null,
  components?:  Array<Component | null > | null,
  status?: DiagramStatus | null,
};

export type Component = {
  __typename: "Component",
  id: string,
  name: string,
  componentType: ComponentType,
  description: string,
  threats?:  Array<Threat | null > | null,
};

export enum ComponentType {
  Process = "Process",
  DataStore = "DataStore",
  DataFlow = "DataFlow",
  Actor = "Actor",
  TrustBoundary = "TrustBoundary",
  ExternalEntity = "ExternalEntity",
}


export type Threat = {
  __typename: "Threat",
  id: string,
  name: string,
  description: string,
  threatType: ThreatType,
  dreadScores: DREADScore,
  action: ThreatAction,
  reason?: string | null,
};

export enum ThreatType {
  Spoofing = "Spoofing",
  Tampering = "Tampering",
  Repudiation = "Repudiation",
  InformationDisclosure = "InformationDisclosure",
  DenialOfService = "DenialOfService",
  ElevationOfPrivileges = "ElevationOfPrivileges",
}


export type DREADScore = {
  __typename: "DREADScore",
  damage: number,
  reproducibility: number,
  exploitability: number,
  affectedUsers: number,
  discoverability: number,
};

export enum ThreatAction {
  Mitigate = "Mitigate",
  Avoid = "Avoid",
  Transfer = "Transfer",
  AcceptIgnore = "AcceptIgnore",
  NotApplicable = "NotApplicable",
}


export enum DiagramStatus {
  NA = "NA",
  GENERATING_THREATS = "GENERATING_THREATS",
  THREATS_GENERATED = "THREATS_GENERATED",
}


export type CreateDiagramInput = {
  id: string,
  s3Prefix: string,
  userDescription?: string | null,
  modelId?: string | null,
};

export type ExtractComponentsInput = {
  id: string,
  s3Prefix: string,
  diagramDescription: string,
  modelId?: string | null,
};

export type ComponentInput = {
  id: string,
  name: string,
  description: string,
  componentType: ComponentType,
  threats?: Array< ThreatInput | null > | null,
};

export type ThreatInput = {
  id: string,
  name: string,
  description: string,
  threatType: ThreatType,
  dreadScores: DREADScoreInput,
  action: ThreatAction,
};

export type DREADScoreInput = {
  damage: number,
  reproducibility: number,
  exploitability: number,
  affectedUsers: number,
  discoverability: number,
};

export type GenerateThreatsInput = {
  id: string,
  s3Prefix: string,
  diagramDescription: string,
  components: Array< ComponentInput >,
  threatTypes: Array< ThreatType | null >,
  modelId?: string | null,
};

export type CreateComponentInput = {
  id: string,
  diagramId: string,
  name?: string | null,
  description?: string | null,
  componentType?: ComponentType | null,
};

export type UpdateComponentInput = {
  id: string,
  diagramId: string,
  componentId: string,
  name?: string | null,
  description?: string | null,
  componentType?: ComponentType | null,
};

export type UpdateThreatInput = {
  id: string,
  diagramId: string,
  componentId: string,
  threatId: string,
  name?: string | null,
  description?: string | null,
  threatType?: ThreatType | null,
  dreadScores?: DREADScoreInput | null,
  action?: ThreatAction | null,
  reason?: string | null,
};

export type DeleteItemResponse = {
  __typename: "DeleteItemResponse",
  success: boolean,
  message?: string | null,
};

export type DiagramId = {
  __typename: "DiagramId",
  id?: string | null,
};

export type Report = {
  __typename: "Report",
  presignedUrl: string,
};

export type DiagramSummary = {
  __typename: "DiagramSummary",
  id: string,
  s3Prefix: string,
  status: DiagramStatus,
  diagramDescription?: string | null,
  userDescription?: string | null,
};

export type GeneratedThreatsSubQuerySubscriptionVariables = {
  id?: string | null,
};

export type GeneratedThreatsSubQuerySubscription = {
  generatedThreats?:  {
    __typename: "Diagram",
    id?: string | null,
    s3Prefix?: string | null,
    userDescription?: string | null,
    diagramDescription?: string | null,
    components?:  Array< {
      __typename: "Component",
      id: string,
      name: string,
      componentType: ComponentType,
      description: string,
      threats?:  Array< {
        __typename: "Threat",
        id: string,
        name: string,
        description: string,
        threatType: ThreatType,
        dreadScores:  {
          __typename: "DREADScore",
          damage: number,
          reproducibility: number,
          exploitability: number,
          affectedUsers: number,
          discoverability: number,
        },
        action: ThreatAction,
      } | null > | null,
    } | null > | null,
  } | null,
};

export type CreateDiagramDescriptionMutationVariables = {
  diagramInput: CreateDiagramInput,
};

export type CreateDiagramDescriptionMutation = {
  createDiagramDescription?:  {
    __typename: "Diagram",
    id?: string | null,
    s3Prefix?: string | null,
    userDescription?: string | null,
    diagramDescription?: string | null,
    components?:  Array< {
      __typename: "Component",
      id: string,
      name: string,
      componentType: ComponentType,
      description: string,
      threats?:  Array< {
        __typename: "Threat",
        id: string,
        name: string,
        description: string,
        threatType: ThreatType,
        dreadScores:  {
          __typename: "DREADScore",
          damage: number,
          reproducibility: number,
          exploitability: number,
          affectedUsers: number,
          discoverability: number,
        },
        action: ThreatAction,
        reason?: string | null,
      } | null > | null,
    } | null > | null,
    status?: DiagramStatus | null,
  } | null,
};

export type DiagramDescriptionMutationVariables = {
  id: string,
  diagramDescription: string,
};

export type DiagramDescriptionMutation = {
  diagramDescription?:  {
    __typename: "Diagram",
    id?: string | null,
    s3Prefix?: string | null,
    userDescription?: string | null,
    diagramDescription?: string | null,
    components?:  Array< {
      __typename: "Component",
      id: string,
      name: string,
      componentType: ComponentType,
      description: string,
      threats?:  Array< {
        __typename: "Threat",
        id: string,
        name: string,
        description: string,
        threatType: ThreatType,
        dreadScores:  {
          __typename: "DREADScore",
          damage: number,
          reproducibility: number,
          exploitability: number,
          affectedUsers: number,
          discoverability: number,
        },
        action: ThreatAction,
        reason?: string | null,
      } | null > | null,
    } | null > | null,
    status?: DiagramStatus | null,
  } | null,
};

export type ExtractComponentsMutationVariables = {
  extractComponentsInput: ExtractComponentsInput,
};

export type ExtractComponentsMutation = {
  extractComponents?:  {
    __typename: "Diagram",
    id?: string | null,
    s3Prefix?: string | null,
    userDescription?: string | null,
    diagramDescription?: string | null,
    components?:  Array< {
      __typename: "Component",
      id: string,
      name: string,
      componentType: ComponentType,
      description: string,
      threats?:  Array< {
        __typename: "Threat",
        id: string,
        name: string,
        description: string,
        threatType: ThreatType,
        dreadScores:  {
          __typename: "DREADScore",
          damage: number,
          reproducibility: number,
          exploitability: number,
          affectedUsers: number,
          discoverability: number,
        },
        action: ThreatAction,
        reason?: string | null,
      } | null > | null,
    } | null > | null,
    status?: DiagramStatus | null,
  } | null,
};

export type ComponentsMutationVariables = {
  id: string,
  components?: Array< ComponentInput | null > | null,
};

export type ComponentsMutation = {
  components?:  {
    __typename: "Diagram",
    id?: string | null,
    s3Prefix?: string | null,
    userDescription?: string | null,
    diagramDescription?: string | null,
    components?:  Array< {
      __typename: "Component",
      id: string,
      name: string,
      componentType: ComponentType,
      description: string,
      threats?:  Array< {
        __typename: "Threat",
        id: string,
        name: string,
        description: string,
        threatType: ThreatType,
        dreadScores:  {
          __typename: "DREADScore",
          damage: number,
          reproducibility: number,
          exploitability: number,
          affectedUsers: number,
          discoverability: number,
        },
        action: ThreatAction,
        reason?: string | null,
      } | null > | null,
    } | null > | null,
    status?: DiagramStatus | null,
  } | null,
};

export type GenerateThreatsMutationVariables = {
  generateThreatsInput: GenerateThreatsInput,
};

export type GenerateThreatsMutation = {
  generateThreats?:  {
    __typename: "Diagram",
    id?: string | null,
    s3Prefix?: string | null,
    userDescription?: string | null,
    diagramDescription?: string | null,
    components?:  Array< {
      __typename: "Component",
      id: string,
      name: string,
      componentType: ComponentType,
      description: string,
      threats?:  Array< {
        __typename: "Threat",
        id: string,
        name: string,
        description: string,
        threatType: ThreatType,
        dreadScores:  {
          __typename: "DREADScore",
          damage: number,
          reproducibility: number,
          exploitability: number,
          affectedUsers: number,
          discoverability: number,
        },
        action: ThreatAction,
        reason?: string | null,
      } | null > | null,
    } | null > | null,
    status?: DiagramStatus | null,
  } | null,
};

export type ThreatsMutationVariables = {
  id: string,
  components?: Array< ComponentInput | null > | null,
};

export type ThreatsMutation = {
  threats?:  {
    __typename: "Diagram",
    id?: string | null,
    s3Prefix?: string | null,
    userDescription?: string | null,
    diagramDescription?: string | null,
    components?:  Array< {
      __typename: "Component",
      id: string,
      name: string,
      componentType: ComponentType,
      description: string,
      threats?:  Array< {
        __typename: "Threat",
        id: string,
        name: string,
        description: string,
        threatType: ThreatType,
        dreadScores:  {
          __typename: "DREADScore",
          damage: number,
          reproducibility: number,
          exploitability: number,
          affectedUsers: number,
          discoverability: number,
        },
        action: ThreatAction,
        reason?: string | null,
      } | null > | null,
    } | null > | null,
    status?: DiagramStatus | null,
  } | null,
};

export type CreateComponentMutationVariables = {
  createComponentInput?: CreateComponentInput | null,
};

export type CreateComponentMutation = {
  createComponent?:  {
    __typename: "Component",
    id: string,
    name: string,
    componentType: ComponentType,
    description: string,
    threats?:  Array< {
      __typename: "Threat",
      id: string,
      name: string,
      description: string,
      threatType: ThreatType,
      dreadScores:  {
        __typename: "DREADScore",
        damage: number,
        reproducibility: number,
        exploitability: number,
        affectedUsers: number,
        discoverability: number,
      },
      action: ThreatAction,
      reason?: string | null,
    } | null > | null,
  } | null,
};

export type UpdateComponentMutationVariables = {
  updateComponentInput?: UpdateComponentInput | null,
};

export type UpdateComponentMutation = {
  updateComponent?:  {
    __typename: "Component",
    id: string,
    name: string,
    componentType: ComponentType,
    description: string,
    threats?:  Array< {
      __typename: "Threat",
      id: string,
      name: string,
      description: string,
      threatType: ThreatType,
      dreadScores:  {
        __typename: "DREADScore",
        damage: number,
        reproducibility: number,
        exploitability: number,
        affectedUsers: number,
        discoverability: number,
      },
      action: ThreatAction,
      reason?: string | null,
    } | null > | null,
  } | null,
};

export type UpdateThreatMutationVariables = {
  updateThreatInput?: UpdateThreatInput | null,
};

export type UpdateThreatMutation = {
  updateThreat?:  {
    __typename: "Threat",
    id: string,
    name: string,
    description: string,
    threatType: ThreatType,
    dreadScores:  {
      __typename: "DREADScore",
      damage: number,
      reproducibility: number,
      exploitability: number,
      affectedUsers: number,
      discoverability: number,
    },
    action: ThreatAction,
    reason?: string | null,
  } | null,
};

export type DeleteComponentMutationVariables = {
  componentId: string,
};

export type DeleteComponentMutation = {
  deleteComponent:  {
    __typename: "DeleteItemResponse",
    success: boolean,
    message?: string | null,
  },
};

export type DeleteThreatMutationVariables = {
  threatId: string,
};

export type DeleteThreatMutation = {
  deleteThreat:  {
    __typename: "DeleteItemResponse",
    success: boolean,
    message?: string | null,
  },
};

export type AllThreatsGeneratedMutationVariables = {
  id: string,
};

export type AllThreatsGeneratedMutation = {
  allThreatsGenerated?:  {
    __typename: "DiagramId",
    id?: string | null,
  } | null,
};

export type GenerateReportMutationVariables = {
  threat_model_id: string,
};

export type GenerateReportMutation = {
  generateReport?:  {
    __typename: "Report",
    presignedUrl: string,
  } | null,
};

export type ListDiagramsQueryVariables = {
};

export type ListDiagramsQuery = {
  listDiagrams?:  Array< {
    __typename: "DiagramSummary",
    id: string,
    s3Prefix: string,
    status: DiagramStatus,
    diagramDescription?: string | null,
    userDescription?: string | null,
  } | null > | null,
};

export type GetDiagramQueryVariables = {
  id: string,
};

export type GetDiagramQuery = {
  getDiagram?:  {
    __typename: "Diagram",
    id?: string | null,
    s3Prefix?: string | null,
    userDescription?: string | null,
    diagramDescription?: string | null,
    components?:  Array< {
      __typename: "Component",
      id: string,
      name: string,
      componentType: ComponentType,
      description: string,
      threats?:  Array< {
        __typename: "Threat",
        id: string,
        name: string,
        description: string,
        threatType: ThreatType,
        dreadScores:  {
          __typename: "DREADScore",
          damage: number,
          reproducibility: number,
          exploitability: number,
          affectedUsers: number,
          discoverability: number,
        },
        action: ThreatAction,
        reason?: string | null,
      } | null > | null,
    } | null > | null,
    status?: DiagramStatus | null,
  } | null,
};

export type CreatedDiagramDescriptionSubscriptionVariables = {
  id?: string | null,
};

export type CreatedDiagramDescriptionSubscription = {
  createdDiagramDescription?:  {
    __typename: "Diagram",
    id?: string | null,
    s3Prefix?: string | null,
    userDescription?: string | null,
    diagramDescription?: string | null,
    components?:  Array< {
      __typename: "Component",
      id: string,
      name: string,
      componentType: ComponentType,
      description: string,
      threats?:  Array< {
        __typename: "Threat",
        id: string,
        name: string,
        description: string,
        threatType: ThreatType,
        dreadScores:  {
          __typename: "DREADScore",
          damage: number,
          reproducibility: number,
          exploitability: number,
          affectedUsers: number,
          discoverability: number,
        },
        action: ThreatAction,
        reason?: string | null,
      } | null > | null,
    } | null > | null,
    status?: DiagramStatus | null,
  } | null,
};

export type ExtractedComponentsSubscriptionVariables = {
  id?: string | null,
};

export type ExtractedComponentsSubscription = {
  extractedComponents?:  {
    __typename: "Diagram",
    id?: string | null,
    s3Prefix?: string | null,
    userDescription?: string | null,
    diagramDescription?: string | null,
    components?:  Array< {
      __typename: "Component",
      id: string,
      name: string,
      componentType: ComponentType,
      description: string,
      threats?:  Array< {
        __typename: "Threat",
        id: string,
        name: string,
        description: string,
        threatType: ThreatType,
        dreadScores:  {
          __typename: "DREADScore",
          damage: number,
          reproducibility: number,
          exploitability: number,
          affectedUsers: number,
          discoverability: number,
        },
        action: ThreatAction,
        reason?: string | null,
      } | null > | null,
    } | null > | null,
    status?: DiagramStatus | null,
  } | null,
};

export type GeneratedThreatsSubscriptionVariables = {
  id?: string | null,
};

export type GeneratedThreatsSubscription = {
  generatedThreats?:  {
    __typename: "Diagram",
    id?: string | null,
    s3Prefix?: string | null,
    userDescription?: string | null,
    diagramDescription?: string | null,
    components?:  Array< {
      __typename: "Component",
      id: string,
      name: string,
      componentType: ComponentType,
      description: string,
      threats?:  Array< {
        __typename: "Threat",
        id: string,
        name: string,
        description: string,
        threatType: ThreatType,
        dreadScores:  {
          __typename: "DREADScore",
          damage: number,
          reproducibility: number,
          exploitability: number,
          affectedUsers: number,
          discoverability: number,
        },
        action: ThreatAction,
        reason?: string | null,
      } | null > | null,
    } | null > | null,
    status?: DiagramStatus | null,
  } | null,
};

export type GeneratedAllThreatsSubscriptionVariables = {
  id?: string | null,
};

export type GeneratedAllThreatsSubscription = {
  generatedAllThreats?:  {
    __typename: "DiagramId",
    id?: string | null,
  } | null,
};
