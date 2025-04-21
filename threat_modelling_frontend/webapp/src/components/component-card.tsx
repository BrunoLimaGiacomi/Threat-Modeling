// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.]
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import React, { useState } from "react";
import { ComponentInput } from "@/API";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ComponentIcon,
  LockIcon,
  Trash2Icon,
  PencilIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ComponentType } from "@/API"; // Add this import at the top of the file
import { generateClient } from "aws-amplify/api";
import * as mutations from "@/graphql/mutations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ComponentCardProps {
  component: ComponentInput;
  diagramId: string;
  threatCount: number;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onUpdate: (updatedComponent: ComponentInput) => void;
  isBulkEditMode: boolean;
  isChecked: boolean;
  onCheckboxChange: () => void;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  component,
  diagramId,
  threatCount,
  isSelected,
  onSelect,
  onRemove,
  onUpdate,
  isBulkEditMode,
  isChecked,
  onCheckboxChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(component.name);
  const [editedDescription, setEditedDescription] = useState(
    component.description || "",
  );
  const [editedType, setEditedType] = useState(component.componentType);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const client = generateClient();
    try {
      const updatedComponent = {
        ...component,
        name: editedName,
        description: editedDescription,
        componentType: editedType,
      };

      const result = await client.graphql({
        query: mutations.updateComponent,
        variables: {
          updateComponentInput: {
            id: diagramId,
            diagramId: diagramId,
            componentId: component.id,
            name: editedName,
            description: editedDescription,
            componentType: editedType,
          },
        },
      });

      if (result.data.updateComponent) {
        onUpdate(updatedComponent);
        setIsEditing(false);
      } else {
        console.error("Failed to update component");
        // Optionally, you can add error handling here, such as showing an error message to the user
      }
    } catch (error) {
      console.error("Error updating component:", error);
      // Optionally, you can add error handling here, such as showing an error message to the user
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedName(component.name);
    setEditedDescription(component.description || "");
    setEditedType(component.componentType);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    const client = generateClient();
    try {
      await client.graphql({
        query: mutations.deleteComponent,
        variables: {
          componentId: component.id,
        },
      });
      onRemove();
    } catch (error) {
      console.error("Error deleting component:", error);
      // Optionally, you can add error handling here, such as showing an error message to the user
    }
  };

  const isSelectable = threatCount === 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "overflow-hidden rounded-md border p-4 shadow-md transition-all",
              isSelected && "ring-2 ring-violet-500",
              isEditing ? "relative bg-slate-50" : "bg-muted/40",
              isBulkEditMode &&
                isChecked &&
                isSelectable &&
                "bg-blue-50 ring-2 ring-blue-500",
              isBulkEditMode && !isSelectable && "opacity-50 saturate-50",
              isBulkEditMode ? "cursor-default" : "cursor-pointer",
              isBulkEditMode && !isSelectable && "cursor-not-allowed",
            )}
            onClick={isBulkEditMode ? undefined : onSelect}
          >
            {isEditing && (
              <div
                className={cn(
                  "absolute left-0 right-0 top-0 h-2 bg-repeat-x",
                  "bg-[linear-gradient(45deg,#ffb900_25%,#81651b_25%,#81651b_50%,#ffb900_50%,#ffb900_75%,#81651b_75%,#81651b_100%)]",
                  "bg-[length:40px_40px]",
                )}
              />
            )}
            <div className={cn("relative", isEditing && "pt-2")}>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isBulkEditMode && (
                      <div className="relative">
                        {isSelectable ? (
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={onCheckboxChange}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div className="flex h-4 w-4 items-center justify-center rounded-sm border border-input bg-background">
                            <XIcon className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    )}
                    {isEditing ? (
                      <Select
                        value={editedType}
                        onValueChange={(value: string) =>
                          setEditedType(value as ComponentType)
                        }
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Actor">Actor</SelectItem>
                          <SelectItem value="ExternalEntity">
                            External Entity
                          </SelectItem>
                          <SelectItem value="DataStore">Data Store</SelectItem>
                          <SelectItem value="Process">Process</SelectItem>
                          <SelectItem value="DataFlow">Data Flow</SelectItem>
                          <SelectItem value="TrustBoundary">
                            Trust Boundary
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge>{component.componentType}</Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {threatCount > 0 && (
                      <div className="flex items-center gap-1">
                        <LockIcon className="h-3 w-3 text-muted-foreground" />
                        <Badge
                          variant="secondary"
                          className="truncate bg-violet-200 text-violet-600 hover:bg-violet-200"
                        >
                          Threats: {threatCount}
                        </Badge>
                      </div>
                    )}
                    {!isBulkEditMode && (
                      <>
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              className="inline-block h-auto rounded-full p-2"
                              onClick={handleSave}
                            >
                              <CheckIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              className="inline-block h-auto rounded-full p-2"
                              onClick={handleCancel}
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              className="inline-block h-auto rounded-full p-2"
                              onClick={handleEdit}
                            >
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <AlertDialog
                              open={isDeleteDialogOpen}
                              onOpenChange={setIsDeleteDialogOpen}
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="inline-block h-auto rounded-full p-2"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2Icon className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete the component{" "}
                                    <span className="font-bold">
                                      "{component.name}"
                                    </span>{" "}
                                    and remove it from the diagram.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={handleDelete}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <h3 className="flex items-center gap-1 text-sm font-medium">
                  {!isEditing && (
                    <ComponentIcon className="h-3 text-violet-600" />
                  )}
                  {isEditing ? (
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span>{component.name}</span>
                  )}
                </h3>
              </div>
              {(component.description || isEditing) && (
                <div className="mt-2">
                  {isEditing ? (
                    <Textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs"
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {component.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </TooltipTrigger>
        {isBulkEditMode && !isSelectable && (
          <TooltipContent>
            <p>
              This component can't be selected because it has associated
              threats.
            </p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export default ComponentCard;
