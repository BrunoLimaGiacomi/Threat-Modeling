// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.]
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import {useCallback, useEffect, useRef, useState} from "react";
import {useParams} from "react-router-dom";

import {generateClient} from "aws-amplify/api";
import * as mutations from "@/graphql/mutations";
import * as subscriptions from "@/graphql/subscriptions";
import * as queries from "@/graphql/queries";
import {generatedThreatsSubQuery} from "@/graphql/custom";
import {ComponentInput, ComponentType, CreateComponentInput, Diagram, ThreatAction, ThreatType,} from "@/API";

import {nanoid} from "nanoid";
import {Badge} from "@/components/ui/badge";
import {Subscription} from "rxjs";
import {getPresignedUrl, removeKeys} from "@/lib/utils";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import FileUpload from "@/components/file-upload";
import {Button} from "@/components/ui/button";
import {
  AlertTriangleIcon,
  ComponentIcon,
  FilterIcon,
  ImageIcon,
  MessageCircleQuestionIcon,
  PencilIcon,
  PlayCircleIcon,
  PlusIcon,
  RefreshCcwIcon,
  RotateCwIcon,
  SearchXIcon,
  Settings2Icon,
  SparklesIcon,
  XCircleIcon,
  ZapIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import Loader from "@/components/loader";
import ComponentCard from "@/components/component-card";
import ThreatCard from "@/components/threat-card";
import {ComponentThreatAction, ThreatWithComponentId} from "@/types";
import Section from "@/components/section";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {TransformComponent, TransformWrapper} from "react-zoom-pan-pinch";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,} from "@/components/ui/tooltip";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getDiagram = async (client: any, modelId: string) => {
  console.log("Getting diagram");
  const result = await client.graphql({
    query: queries.getDiagram,
    variables: {
      id: modelId,
    },
  });
  return result.data.getDiagram;
};

// Add this enum near the top of the file, after other imports
enum ActionReasonPrompt {
  Mitigate = "How will you mitigate this threat?",
  Avoid = "How will you be avoiding this threat?",
  Transfer = "To whom are you transferring this threat?",
  AcceptIgnore = "Why are you accepting or ignoring this threat?",
  NotApplicable = "Why is this not applicable?",
}

const Flow: React.FC = () => {
  const clientRef = useRef(generateClient());

  const { modelId } = useParams<{ modelId: string }>();
  const [id, setId] = useState(modelId || nanoid());
  const [s3Prefix, setS3Prefix] = useState<string>();
  const [diagram, setDiagram] = useState<Diagram>();
  const [diagramDescription, setDiagramDescription] = useState<string>();
  const [diagramComponents, setDiagramComponents] =
    useState<ComponentInput[]>();
  const [componentThreats, setComponentThreats] = useState<
    ThreatWithComponentId[]
  >([]);

  // Filters
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  );
  const [selectedThreatType, setSelectedThreatType] =
    useState<ThreatType | null>(null);

  // Switches
  const [selectedThreatTypes, setSelectedThreatTypes] = useState<ThreatType[]>(
    Object.values(ThreatType),
  );

  const [isThreatTypeDropdownOpen, setIsThreatTypeDropdownOpen] =
    useState(false);

  // Loading indicators
  const [isLoadingDescription, setIsLoadingDescription] =
    useState<boolean>(false);
  const [isLoadingComponents, setIsLoadingComponents] =
    useState<boolean>(false);
  const [isLoadingThreats, setIsLoadingThreats] = useState<boolean>(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  // Threat actions
  const [componentThreatActions, setComponentThreatActions] = useState<
    ComponentThreatAction[]
  >([]);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [currentThreatAction, setCurrentThreatAction] =
    useState<ThreatWithComponentId | null>(null);
  const [threatActionType, setThreatActionType] = useState<ThreatAction>(
    ThreatAction.Mitigate,
  );
  const [threatActionReason, setThreatActionReason] = useState("");

  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [isLoadingDiagram, setIsLoadingDiagram] = useState<boolean>(false);

  // Add new component
  const [isAddComponentModalOpen, setIsAddComponentModalOpen] = useState(false);
  const [newComponent, setNewComponent] = useState<CreateComponentInput>({
    id: "",
    diagramId: "",
    name: "",
    componentType: ComponentType.Actor,
    description: "",
  });

  const [isReExtractDialogOpen, setIsReExtractDialogOpen] = useState(false);

  const [isImageLoading, setIsImageLoading] = useState(true);

  const [userDescription, setUserDescription] = useState<string>("");

  const [isDescriptionSent, setIsDescriptionSent] = useState(false);

  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    const fetchDiagram = async () => {
      if (modelId) {
        console.log("id found in params");
        setIsLoadingDiagram(true);
        try {
          const diagramData = await getDiagram(clientRef.current, modelId);
          console.log("Fetched diagram:", diagramData);

          setId(diagramData.id);
          setDiagram(diagramData);
          setS3Prefix(diagramData.s3Prefix);
          setDiagramDescription(diagramData.diagramDescription);
          setUserDescription(diagramData.userDescription || ""); // Add this line

          if (diagramData.components) {
            const cleanedComponents: ComponentInput[] =
              diagramData.components.map((component: ComponentInput) => {
                const cleanedComponent = removeKeys(component, ["__typename"]);
                if (cleanedComponent.threats) {
                  cleanedComponent.threats = cleanedComponent.threats.map(
                    (threat) => removeKeys(threat, ["__typename"]),
                  );
                }
                return cleanedComponent;
              });
            setDiagramComponents(cleanedComponents);

            const threatsWithComponentId: ThreatWithComponentId[] = [];

            cleanedComponents.forEach((component: ComponentInput) => {
              if (component.threats?.length) {
                component.threats.forEach((threat) => {
                  threatsWithComponentId.push({
                    ...threat,
                    componentId: component.id,
                  } as ThreatWithComponentId);
                });
              }
            });
            setComponentThreats(threatsWithComponentId);
          }

          setIsLoadingDescription(false);
          setIsLoadingComponents(false);
        } catch (error) {
          console.error("Error fetching diagram:", error);
        } finally {
          setIsLoadingDiagram(false);
        }
      }
    };

    fetchDiagram();
  }, [modelId]);

  useEffect(() => {
    const fetchImageUrl = async () => {
      if (s3Prefix) {
        try {
          const result = await getPresignedUrl(s3Prefix);
          setImageUrl(result.url.toString());
        } catch (error) {
          console.error("Error fetching presigned URL:", error);
        }
      }
    };

    fetchImageUrl();
  }, [s3Prefix]);

  const createDiagram = useCallback(
    async (path: string) => {
      console.log("Upload finished. Creating with path:", path);
      setDiagramDescription(undefined);
      setIsLoadingDescription(true);
      setIsDescriptionSent(true); // Set this to true as soon as the upload begins
      console.log(`Subscribing to ${id}`);

      const createDiagramSub = clientRef.current
        .graphql({
          query: subscriptions.createdDiagramDescription,
          variables: { id: id },
        })
        .subscribe({
          next: (data) => {
            console.log("Received data:", data);
            if (data?.data?.createdDiagramDescription?.diagramDescription) {
              setDiagram(data?.data?.createdDiagramDescription);
              setDiagramDescription(
                data?.data?.createdDiagramDescription?.diagramDescription,
              );
              createDiagramSub.unsubscribe();
            }
            setIsLoadingDescription(false);
          },
          error: (error) => {
            console.error("Error in subscription:", error);
            setIsDescriptionSent(false); // Reset if there's an error
          },
        });

      try {
        await clientRef.current.graphql({
          query: mutations.createDiagramDescription,
          variables: {
            diagramInput: {
              id: id,
              s3Prefix: path,
              userDescription: userDescription,
            },
          },
        });
        setS3Prefix(path);
        console.log("Description sent successfully");
      } catch (error) {
        console.error("Error creating diagram:", error);
        setIsDescriptionSent(false); // Reset if there's an error
      }
    },
    [id, userDescription],
  );

  useEffect(() => {
    console.log("isDescriptionSent changed:", isDescriptionSent);
  }, [isDescriptionSent]);

  const runExtractComponents = async () => {
    console.log("Subscribing to extractedComponents");
    setIsLoadingComponents(true);

    const extractComponentsSub: Subscription = clientRef.current
      .graphql({
        query: subscriptions.extractedComponents,
        variables: { id: id },
      })
      .subscribe({
        next: (data) => {
          console.log("Received components:", data);
          if (data?.data?.extractedComponents?.components) {
            const components = removeKeys(
              data?.data?.extractedComponents?.components,
              ["__typename"],
            );

            setDiagramComponents((prevComponents) => {
              return [
                ...(prevComponents || []),
                ...(components as ComponentInput[]),
              ];
            });
            extractComponentsSub.unsubscribe();
            setIsLoadingComponents(false);
          } else {
            throw new Error("No components extracted");
          }
        },
        error: (error) => {
          console.error(error);
        },
      });

    if (diagramDescription && s3Prefix) {
      console.log("Extracting components");

      const query = await clientRef.current.graphql({
        query: mutations.extractComponents,
        variables: {
          extractComponentsInput: {
            id: id,
            diagramDescription: diagramDescription,
            s3Prefix: s3Prefix,
          },
        },
      });

      console.log("extractComponents mutation result", query);
    } else {
      throw new Error("Diagram description or image are not set");
    }
  };

  const runGenerateThreats = async () => {
    console.log("Subscribing to generatedThreats");
    setIsLoadingThreats(true);

    const generatedThreatsSub = clientRef.current
      .graphql({
        query: generatedThreatsSubQuery,
        variables: { id: id },
      })
      .subscribe({
        next: (response) => {
          console.log("Received threats:", response);
          const components = response.data.generatedThreats.components;
          const threatsWithComponentId: ThreatWithComponentId[] = [];

          if (components?.length) {
            components.forEach((component) => {
              component?.threats?.forEach((threat) => {
                const threatWithComponentId: ThreatWithComponentId = {
                  ...threat,
                  componentId: component.id,
                };
                threatsWithComponentId.push(threatWithComponentId);
              });
            });
          }

          setComponentThreats((threats) => {
            return [...threats, ...threatsWithComponentId];
          });
        },
        error: (error) => {
          console.error(error);
        },
      });

    const allThreatsGeneratedSub = clientRef.current
      .graphql({
        query: subscriptions.generatedAllThreats,
        variables: { id: id },
      })
      .subscribe({
        next: (response) => {
          console.log(
            "Generated all threats! Will unsubscribe to generatedThreats...",
            response,
          );

          generatedThreatsSub.unsubscribe();
          allThreatsGeneratedSub.unsubscribe();
          setIsLoadingThreats(false);
        },
        error: (error) => {
          console.error(error);
        },
      });

    console.log("Generating threats");

    if (s3Prefix && diagramDescription && diagramComponents) {
      const query = await clientRef.current.graphql({
        query: mutations.generateThreats,
        variables: {
          generateThreatsInput: {
            id: id,
            diagramDescription: diagramDescription,
            s3Prefix: s3Prefix,
            components: diagramComponents.map((component) => ({
              ...component,
              threats: component.threats?.map((threat) =>
                removeKeys(threat, ["reason", "__typename"]),
              ),
            })),
            threatTypes:
              selectedThreatTypes.length > 0 ? selectedThreatTypes : [null],
          },
        },
      });

      console.log("generateThreats mutation result", query);
    } else {
      throw new Error(`Missing parameters: s3Prefix: ${s3Prefix} | diagramDescription: ${diagramDescription} | diagramComponents: ${diagramComponents}`);
    }
  };

  const handleDiagramDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setDiagramDescription(e.target.value);
  };

  const handleSubmitDiagramDescription = () => {
    if (diagramComponents && diagramComponents.length > 0) {
      setIsReExtractDialogOpen(true);
    } else {
      runExtractComponents();
    }
  };

  const confirmReExtract = () => {
    setIsReExtractDialogOpen(false);
    runExtractComponents();
  };

  const handleRemoveComponent = (componentId: string) => {
    const remainingComponents = diagramComponents?.filter(
      (c) => c.id !== componentId,
    );
    setDiagramComponents(remainingComponents);
  };

  const handleSubmitGenerateThreats = () => {
    runGenerateThreats();
    resetFilters();
  };

  const toggleThreatType = useCallback((threatType: ThreatType) => {
    setSelectedThreatTypes((prev) => {
      if (prev.includes(threatType)) {
        // Prevent deselecting if it's the last selected type
        if (prev.length === 1) return prev;
        return prev.filter((type) => type !== threatType);
      } else {
        return [...prev, threatType];
      }
    });
  }, []);

  const filteredThreats = componentThreats.filter((threat) => {
    const componentMatch =
      !selectedComponentId || threat.componentId === selectedComponentId;
    const threatTypeMatch =
      !selectedThreatType || threat.threatType === selectedThreatType;
    return componentMatch && threatTypeMatch;
  });

  const isFiltered =
    selectedComponentId !== null || selectedThreatType !== null;

  const handleComponentClick = (componentId: string) => {
    setSelectedComponentId((prevId) =>
      prevId === componentId ? null : componentId,
    );
  };

  const resetFilters = () => {
    setSelectedComponentId(null);
    setSelectedThreatType(null);
  };

  const handleActionClick = (threat: ThreatWithComponentId, action: string) => {
    setCurrentThreatAction(threat);
    setIsActionModalOpen(true);

    // Always set the threatActionType to the clicked action
    setThreatActionType(action as ThreatAction);

    // Find existing action for this threat
    const existingAction = componentThreatActions.find(
      (a) => a.componentId === threat.componentId && a.threatId === threat.id,
    );

    // Set the reason if there's an existing action, otherwise clear it
    if (existingAction && existingAction.action === action) {
      setThreatActionReason(existingAction.reason);
    } else {
      setThreatActionReason("");
    }
  };

  const handleThreatActionTypeChange = (value: string) => {
    const newActionType = value as ThreatAction;
    setThreatActionType(newActionType);

    // If the action type hasn't changed, keep the existing reason
    if (currentThreatAction && currentThreatAction.componentId) {
      const existingAction = componentThreatActions.find(
        (action) =>
          action.componentId === currentThreatAction.componentId &&
          action.threatId === currentThreatAction.id,
      );

      if (existingAction && existingAction.action === newActionType) {
        setThreatActionReason(existingAction.reason);
      } else {
        setThreatActionReason("");
      }
    }
  };

  const handleThreatActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentThreatAction && currentThreatAction.componentId) {
      const newAction: ComponentThreatAction = {
        componentId: currentThreatAction.componentId,
        threatId: currentThreatAction.id,
        action: threatActionType,
        reason: threatActionReason,
      };

      const result = await clientRef.current.graphql({
        query: mutations.updateThreat,
        variables: {
          updateThreatInput: {
            id: diagram!.id!,
            diagramId: diagram!.id!,
            componentId: currentThreatAction.componentId,
            threatId: currentThreatAction.id,
            action: threatActionType,
            reason: threatActionReason,
          },
        },
      });

      if (result.data) {
        // Update the local state
        setComponentThreats((prevThreats) =>
          prevThreats.map((threat) =>
            threat.id === currentThreatAction.id
              ? {
                  ...threat,
                  action: threatActionType,
                  reason: threatActionReason,
                }
              : threat,
          ),
        );

        setComponentThreatActions((prevActions) =>
          prevActions
            .filter((action) => action.threatId !== newAction.threatId)
            .concat(newAction),
        );
      } else {
        // maybe show a toaster with error?
        console.error("ERROR UPDATING THREAT!");
      }

      setIsActionModalOpen(false);
      setThreatActionReason("");
    }
  };

  const handleUpdateComponent = (updatedComponent: ComponentInput) => {
    setDiagramComponents((prevComponents) =>
      prevComponents?.map((c) =>
        c.id === updatedComponent.id ? updatedComponent : c,
      ),
    );
  };

  const handleAddComponent = async () => {
    if (newComponent.name && newComponent.componentType && diagram) {
      const componentToAdd: CreateComponentInput = {
        ...newComponent,
        id: diagram.id!,
        diagramId: diagram.id!,
      };

      const result = await clientRef.current.graphql({
        query: mutations.createComponent,
        variables: {
          createComponentInput: componentToAdd,
        },
      });

      if (result.data.createComponent) {
        setDiagramComponents((prev) => [
          ...(prev || []),
          result.data.createComponent,
        ]);
        setIsAddComponentModalOpen(false);
        setNewComponent({
          id: "",
          diagramId: "",
          name: "",
          componentType: ComponentType.Actor,
          description: "",
        });
      } else {
        console.error("Failed to create component");
        // Optionally, you can add error handling here, such as showing an error message to the user
      }
    }
  };

  const handleNewComponentChange = (
    field: keyof ComponentInput,
    value: string,
  ) => {
    setNewComponent((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateThreat = (updatedThreat: ThreatWithComponentId) => {
    setComponentThreats((prevThreats) =>
      prevThreats.map((threat) =>
        threat.id === updatedThreat.id ? updatedThreat : threat,
      ),
    );
    // You may want to add an API call here to update the threat on the server
  };

  // Add this function to get the appropriate prompt
  const getActionReasonPrompt = (action: ThreatAction): string => {
    return (ActionReasonPrompt as Record<string, string>)[action] || "Reason";
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    const report = await clientRef.current.graphql({
      query: mutations.generateReport,
      variables: {
        threat_model_id: diagram!.id!,
      },
    });

    if (report.data) {
      const { presignedUrl } = report.data.generateReport;
      console.log(presignedUrl);

      const anchor = document.createElement("a");
      if (anchor.download !== undefined) {
        anchor.href = presignedUrl;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      } else {
        console.error("BROWSER DOES NOT SUPPORT HTML5!");
      }

      setIsGeneratingReport(false);
    }
  };

  const toggleBulkEditMode = () => {
    setIsBulkEditMode(!isBulkEditMode);
    setSelectedComponents([]);
  };

  const toggleComponentSelection = (componentId: string) => {
    setSelectedComponents((prev) =>
      prev.includes(componentId)
        ? prev.filter((id) => id !== componentId)
        : [...prev, componentId],
    );
  };

  const handleBulkDelete = async () => {
    setIsDeleteConfirmOpen(true);
  };

  const confirmBulkDelete = async () => {
    setIsDeleteConfirmOpen(false);
    // Implement the bulk delete logic here
    for (const componentId of selectedComponents) {
      try {
        await clientRef.current.graphql({
          query: mutations.deleteComponent,
          variables: {
            componentId: componentId,
          },
        });
      } catch (error) {
        console.error(`Error deleting component ${componentId}:`, error);
      }
    }

    // Update the local state
    setDiagramComponents((prev) =>
      prev?.filter((component) => !selectedComponents.includes(component.id)),
    );
    setSelectedComponents([]);
    setIsBulkEditMode(false);
  };

  return (
    <div className="container px-2 pb-20 xl:px-0">
      <div className="mb-3 flex items-center gap-3">
        <h1 className="text-2xl font-bold">Demo Flow</h1>
        <Badge
          variant={"secondary"}
          className="gap-2 rounded-sm bg-white font-mono text-slate-500 shadow-sm hover:bg-white"
        >
          <span className="font-bold text-blue-600">
            {!modelId && "NEW "}ID:
          </span>
          <span>{modelId || id}</span>
        </Badge>
      </div>

      {isLoadingDiagram && (
        <Loader className="lg:w-full" message="Loading diagram..." />
      )}

      {!isLoadingDiagram && (
        <>
          {!modelId && (
            <>
              <Section
                title="User Description"
                icon={<PencilIcon className="w-6 text-blue-500" />}
              >
                <div className="grid w-full items-center gap-3">
                  <Textarea
                    id="userDescription"
                    placeholder="Enter a description of your diagram..."
                    required
                    rows={5}
                    value={userDescription}
                    onChange={(e) => setUserDescription(e.target.value)}
                    className="bg-slate-50 font-mono"
                  />
                </div>
              </Section>
              <FileUpload
                className="mb-3"
                onSuccess={createDiagram}
                s3Prefix={`uploads/${id}`}
                onFileSelect={() => setIsDescriptionSent(true)} // Add this line
              />
            </>
          )}
          {imageUrl && (
            <Section
              title="Diagram Image"
              icon={<ImageIcon className="w-6 text-lime-500" />}
              headerContent={
                modelId &&
                userDescription && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MessageCircleQuestionIcon className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          <span className="font-bold">User Description:</span>{" "}
                          {userDescription}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              }
            >
              <div className="relative w-full">
                <TransformWrapper
                  initialScale={1}
                  initialPositionX={0}
                  initialPositionY={0}
                >
                  {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                      <div className="min-h-[16rem] w-full min-w-[24rem] overflow-hidden rounded-lg border border-slate-200">
                        <TransformComponent>
                          {isImageLoading && (
                            <div className="flex h-64 w-full items-center justify-center">
                              <Loader message="Loading diagram..." />
                            </div>
                          )}
                          <img
                            src={imageUrl}
                            alt="Diagram"
                            className={`h-auto w-full ${isImageLoading ? "hidden" : ""}`}
                            onLoad={() => setIsImageLoading(false)}
                          />
                        </TransformComponent>
                      </div>

                      <div className="absolute bottom-2 right-2 z-10 flex flex-col gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => zoomIn()}
                                className="bg-white/80 backdrop-blur-sm"
                              >
                                <ZoomInIcon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p>Zoom In</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => zoomOut()}
                                className="bg-white/80 backdrop-blur-sm"
                              >
                                <ZoomOutIcon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p>Zoom Out</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => resetTransform()}
                                className="bg-white/80 backdrop-blur-sm"
                              >
                                <RotateCwIcon className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p>Reset View</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </>
                  )}
                </TransformWrapper>
              </div>
            </Section>
          )}

          {isLoadingDescription && (
            <Loader message="Generating diagram description..." />
          )}

          {diagram && diagramDescription && (
            <Section
              title="Diagram description"
              icon={<SparklesIcon className="w-6 text-indigo-500" />}
            >
              <div className="grid w-full items-center gap-3">
                <Textarea
                  id="description"
                  placeholder="A generated description of you diagram."
                  required
                  rows={10}
                  value={diagramDescription}
                  onChange={handleDiagramDescriptionChange}
                  className="bg-slate-50 font-mono"
                  disabled={isLoadingComponents}
                />
              </div>
              <div className="grid w-full items-center gap-3">
                <Button
                  onClick={handleSubmitDiagramDescription}
                  disabled={isLoadingComponents}
                >
                  {diagramComponents && diagramComponents.length > 0 ? (
                    <>
                      <RefreshCcwIcon className="mr-2 w-5" />
                      Re-extract
                    </>
                  ) : (
                    <>
                      <PlayCircleIcon className="mr-2 w-5" />
                      Extract
                    </>
                  )}
                  &nbsp;Diagram Components
                </Button>
              </div>
            </Section>
          )}

          {isLoadingComponents && (
            <Loader
              message={`${diagramComponents && diagramComponents.length > 0 ? "Re-Extracting" : "Extracting"} components...`}
            />
          )}

          {diagramComponents && diagramComponents.length > 0 && (
            <Section
              title="Extracted components"
              icon={<ComponentIcon className="w-6 text-violet-500" />}
              badge={diagramComponents.length}
              headerContent={
                <div className="flex items-center gap-2">
                  <Button
                    variant={isBulkEditMode ? "secondary" : "outline"}
                    onClick={toggleBulkEditMode}
                  >
                    {isBulkEditMode ? "Exit Bulk Edit" : "Bulk Edit"}
                  </Button>
                  {isBulkEditMode && (
                    <Button
                      variant="destructive"
                      onClick={handleBulkDelete}
                      disabled={selectedComponents.length === 0}
                    >
                      Delete Selected ({selectedComponents.length})
                    </Button>
                  )}
                </div>
              }
            >
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {diagramComponents
                  .sort((a, b) => {
                    const order = [
                      "Actor",
                      "ExternalEntity",
                      "DataStore",
                      "Process",
                      "DataFlow",
                      "TrustBoundary",
                    ];
                    const typeComparison =
                      order.indexOf(a.componentType) -
                      order.indexOf(b.componentType);

                    // If components are of the same type, sort by name
                    if (typeComparison === 0) {
                      return a.name.localeCompare(b.name);
                    }

                    return typeComparison;
                  })
                  .map((component, index) => {
                    const threatCount = componentThreats.filter(
                      (threat) => threat.componentId === component.id,
                    ).length;
                    return (
                      <ComponentCard
                        key={`${component.id}-${index}`}
                        component={component}
                        diagramId={diagram?.id || ""}
                        threatCount={threatCount}
                        isSelected={selectedComponentId === component.id}
                        onSelect={() => handleComponentClick(component.id)}
                        onRemove={() => handleRemoveComponent(component.id)}
                        onUpdate={(updatedComponent) =>
                          handleUpdateComponent(updatedComponent)
                        }
                        isBulkEditMode={isBulkEditMode}
                        isChecked={selectedComponents.includes(component.id)}
                        onCheckboxChange={() =>
                          toggleComponentSelection(component.id)
                        }
                      />
                    );
                  })}
                {/* Add component button - only show when not in bulk edit mode */}
                {!isBulkEditMode && (
                  <div className="flex h-full cursor-pointer items-center justify-center overflow-hidden rounded-md border p-4 shadow-md transition-all hover:bg-slate-50">
                    <Button
                      variant="ghost"
                      className="h-full w-full"
                      onClick={() => setIsAddComponentModalOpen(true)}
                    >
                      <PlusIcon className="mr-2 h-5 w-5" />
                      Add component
                    </Button>
                  </div>
                )}
              </div>
              <div className="grid w-full items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleSubmitGenerateThreats}
                    disabled={
                      selectedThreatTypes.length === 0 || isLoadingThreats
                    }
                    className="w-full"
                  >
                    <PlayCircleIcon className="mr-2 w-5" /> Generate threats
                  </Button>
                  <DropdownMenu
                    open={isThreatTypeDropdownOpen}
                    onOpenChange={setIsThreatTypeDropdownOpen}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="relative"
                        disabled={isLoadingThreats}
                      >
                        <Settings2Icon className="h-4 w-4" />
                        {selectedThreatTypes.length > 0 && (
                          <Badge
                            variant="default"
                            className="absolute -right-2 -top-2 justify-center rounded-full px-2 text-xs"
                          >
                            {selectedThreatTypes.length}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuLabel>Threat Types</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {Object.values(ThreatType).map((type) => (
                        <DropdownMenuItem
                          key={type}
                          onSelect={(event) => event.preventDefault()}
                        >
                          <div className="flex w-full items-center justify-between">
                            <span>{type}</span>
                            <Switch
                              checked={selectedThreatTypes.includes(type)}
                              onCheckedChange={() => toggleThreatType(type)}
                            />
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </Section>
          )}

          {isLoadingThreats && <Loader message="Generating threats..." />}

          {diagramComponents && !!componentThreats.length && (
            <Section
              title="Extracted threats"
              icon={<AlertTriangleIcon className="w-6 text-amber-500" />}
              badge={componentThreats.length}
              headerContent={
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                  >
                    Generate XLS Report
                  </Button>
                  {isFiltered && (
                    <Badge
                      variant="secondary"
                      className="bg-violet-200 text-violet-600 hover:bg-violet-200"
                    >
                      <FilterIcon className="mr-1 h-3 w-3 fill-violet-600" />
                      Filtering: {filteredThreats.length} threats
                    </Badge>
                  )}
                  <Select
                    value={selectedComponentId || "all"}
                    onValueChange={(value) =>
                      setSelectedComponentId(value === "all" ? null : value)
                    }
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by Component" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem defaultValue={"all"} value="all">
                        All Components
                      </SelectItem>
                      {diagramComponents.map((component) => (
                        <SelectItem key={component.id} value={component.id}>
                          {component.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedThreatType || "all"}
                    onValueChange={(value) =>
                      setSelectedThreatType(
                        value === "all" ? null : (value as ThreatType),
                      )
                    }
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by Threat Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Threat Types</SelectItem>
                      {Object.values(ThreatType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={resetFilters}
                    disabled={!selectedComponentId && !selectedThreatType}
                  >
                    <XCircleIcon className="h-4 w-4" />
                  </Button>
                </div>
              }
            >
              {filteredThreats.length > 0 ? (
                <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filteredThreats.map((threat, index) => (
                    <ThreatCard
                      key={`${threat.id}-${index}`}
                      threat={threat}
                      componentName={
                        diagramComponents.find(
                          (component) => component.id === threat.componentId,
                        )?.name || ""
                      }
                      diagramId={diagram?.id || ""}
                      onActionClick={(threat, action) =>
                        handleActionClick(threat, action)
                      }
                      actionTaken={componentThreatActions.find(
                        (action) => action.threatId === threat.id,
                      )}
                      onUpdate={handleUpdateThreat}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <SearchXIcon className="mb-4 h-12 w-12 text-slate-400" />
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">
                    No matching threats found
                  </h3>
                  <p className="text-slate-500">
                    Try adjusting your filters or selecting a different
                    component to see more results.
                  </p>
                </div>
              )}
            </Section>
          )}

          {/* Action Modal */}
          <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex flex-col gap-2">
                  <span className="flex items-center gap-2">
                    <ZapIcon className="h-5 w-5 text-amber-500" />
                    Acting on threat
                  </span>
                </DialogTitle>
                <div className="flex items-start justify-between gap-2 pt-2">
                  <Badge
                    variant={"secondary"}
                    className="select-none gap-1 rounded-sm bg-white font-mono text-slate-500 shadow-sm hover:bg-white"
                  >
                    <span className="font-bold text-blue-600">ID: </span>
                    <span className="w-full truncate">
                      {currentThreatAction?.id}
                    </span>
                  </Badge>
                  <Badge
                    variant={"secondary"}
                    className="select-none gap-1 rounded-sm bg-white font-medium text-slate-500 shadow-sm hover:bg-white"
                  >
                    <ComponentIcon className="h-4 w-4 text-violet-600" />
                    <span className="w-full truncate">
                      {diagramComponents?.find(
                        (c) => c.id === currentThreatAction?.componentId,
                      )?.name || ""}
                    </span>
                  </Badge>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded bg-slate-100 p-3 text-sm">
                  <Badge>{currentThreatAction?.threatType}</Badge>{" "}
                  {currentThreatAction?.name}
                </div>

                <DialogDescription>
                  {currentThreatAction && (
                    <span className="flex rounded bg-slate-100 p-3 text-xs">
                      {currentThreatAction.description}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleThreatActionSubmit}>
                <div className="grid gap-4 pb-4 pt-2">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="action">Chosen action</Label>
                    <Select
                      value={threatActionType}
                      onValueChange={handleThreatActionTypeChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an action" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(ThreatAction).map((action) => (
                          <SelectItem key={action} value={action}>
                            {action}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="threatActionReason">
                      {getActionReasonPrompt(threatActionType)}
                    </Label>
                    <Textarea
                      id="threatActionReason"
                      value={threatActionReason}
                      onChange={(e) => setThreatActionReason(e.target.value)}
                      className="col-span-3"
                      placeholder="Enter details about the action..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button type="submit">Save changes</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Component Modal */}
          <Dialog
            open={isAddComponentModalOpen}
            onOpenChange={setIsAddComponentModalOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Component</DialogTitle>
                <DialogDescription>
                  Enter the details for the new component you want to add to the
                  diagram.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newComponent.name!}
                    onChange={(e) =>
                      handleNewComponentChange("name", e.target.value)
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select
                    onValueChange={(value) =>
                      handleNewComponentChange(
                        "componentType",
                        value as ComponentType,
                      )
                    }
                    value={newComponent.componentType!}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select component type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ComponentType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={newComponent.description!}
                    onChange={(e) =>
                      handleNewComponentChange("description", e.target.value)
                    }
                    className="col-span-3"
                    placeholder="Enter component description..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddComponent}>Add Component</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Re-extract Dialog */}
          <AlertDialog
            open={isReExtractDialogOpen}
            onOpenChange={setIsReExtractDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Re-extraction</AlertDialogTitle>
                <AlertDialogDescription>
                  Re-extracting components may generate duplicate items. Are you
                  sure you want to proceed?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmReExtract}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog
            open={isDeleteConfirmOpen}
            onOpenChange={setIsDeleteConfirmOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {selectedComponents.length}{" "}
                  selected component(s)? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmBulkDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};

export default Flow;
