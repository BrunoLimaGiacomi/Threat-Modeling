// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.]
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import React, { useState } from "react";
import { ThreatWithComponentId, ComponentThreatAction } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreVerticalIcon,
  ComponentIcon,
  HammerIcon,
  HandIcon,
  ArrowRightIcon,
  CircleSlashIcon,
  ZapIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  Loader2,
} from "lucide-react";
import DreadScoreDisplay from "@/components/dread-score-display";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DREADScoreInput, ThreatType, ThreatAction } from "@/API";
import { cn } from "@/lib/utils";
import { generateClient } from "aws-amplify/api";
import * as mutations from "@/graphql/mutations";

const actionIcons = {
  [ThreatAction.Mitigate]: HammerIcon,
  [ThreatAction.Avoid]: HandIcon,
  [ThreatAction.Transfer]: ArrowRightIcon,
  [ThreatAction.AcceptIgnore]: CheckIcon,
  [ThreatAction.NotApplicable]: CircleSlashIcon,
};

interface ThreatCardProps {
  threat: ThreatWithComponentId;
  diagramId: string;
  componentName: string;
  onActionClick: (threat: ThreatWithComponentId, action: string) => void;
  actionTaken?: ComponentThreatAction;
  onUpdate: (updatedThreat: ThreatWithComponentId) => void;
}

const ThreatCard: React.FC<ThreatCardProps> = ({
  threat,
  diagramId,
  componentName,
  onActionClick,
  actionTaken,
  onUpdate,
}) => {
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(threat.name);
  const [editedDescription, setEditedDescription] = useState(
    threat.description,
  );
  const [editedThreatType, setEditedThreatType] = useState(threat.threatType);
  const [editedDreadScores, setEditedDreadScores] = useState(
    threat.dreadScores,
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleActionClick = (
    threat: ThreatWithComponentId,
    action: ThreatAction,
  ) => {
    onActionClick(threat, action);
    setOpen(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleDreadScoreChange = (dimension: string, value: number) => {
    setEditedDreadScores((prev) => ({
      ...prev,
      [dimension]: value,
    }));
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaving(true);
    const client = generateClient();
    try {
      // Create a new dreadScores object without __typename
      const cleanedDreadScores = Object.fromEntries(
        Object.entries(editedDreadScores).filter(
          ([key]) => key !== "__typename",
        ),
      );

      const updatedThreat = {
        ...threat,
        name: editedName,
        description: editedDescription,
        threatType: editedThreatType,
        dreadScores: cleanedDreadScores,
      };

      const result = await client.graphql({
        query: mutations.updateThreat,
        variables: {
          updateThreatInput: {
            id: diagramId,
            diagramId: diagramId,
            componentId: threat.componentId,
            threatId: threat.id,
            name: editedName,
            description: editedDescription,
            threatType: editedThreatType,
            dreadScores: cleanedDreadScores as DREADScoreInput,
          },
        },
      });

      if (result.data.updateThreat) {
        // Cast the updatedThreat to the expected type
        onUpdate(updatedThreat as ThreatWithComponentId);
        setIsEditing(false);
      } else {
        console.error("Failed to update threat");
      }
    } catch (error) {
      console.error("Error updating threat:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditedName(threat.name);
    setEditedDescription(threat.description);
    setEditedThreatType(threat.threatType);
    setEditedDreadScores(threat.dreadScores);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 overflow-hidden rounded-md border p-4 shadow-md transition-all",
        isEditing ? "relative bg-slate-50" : "bg-muted/40",
      )}
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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-start gap-1">
          <Badge
            variant={"secondary"}
            className="max-w-32 select-none gap-1 rounded-sm bg-white font-mono text-slate-500 shadow-sm hover:bg-white"
          >
            <span className="font-bold text-blue-600">ID: </span>
            <span className="w-full truncate">{threat.id}</span>
          </Badge>
          <Badge
            variant={"secondary"}
            className="max-w-32 select-none gap-1 rounded-sm bg-white font-medium text-slate-500 shadow-sm hover:bg-white"
          >
            <ComponentIcon className="h-4 w-4 text-violet-600" />
            <span className="w-full truncate">{componentName}</span>
          </Badge>
        </div>

        {isEditing ? (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              className="inline-block h-auto rounded-full p-2"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
              ) : (
                <CheckIcon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              className="inline-block h-auto rounded-full p-2"
              onClick={handleCancel}
              disabled={isSaving}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              className="inline-block h-auto rounded-full p-2"
              onClick={handleEdit}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <DropdownMenu open={open} onOpenChange={setOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="inline-block h-auto rounded-full p-2"
                >
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align={"start"}>
                <DropdownMenuLabel className="flex items-center gap-2">
                  <ZapIcon className="h-4 w-4 stroke-amber-600" /> Actions
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.values(ThreatAction).map((action) => {
                  const IconComponent = actionIcons[action];
                  return (
                    <DropdownMenuItem
                      key={action}
                      onClick={() => handleActionClick(threat, action)}
                      className="min-w-40 cursor-pointer text-sm"
                    >
                      <IconComponent className="mr-3 h-4 w-4" /> {action}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <h3 className="flex items-start gap-3 text-sm font-medium md:flex-col md:gap-1 lg:flex-row lg:items-center lg:gap-3">
        {isEditing ? (
          <Select
            value={editedThreatType}
            onValueChange={(value) => setEditedThreatType(value as ThreatType)}
            disabled={isSaving}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ThreatType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge>{threat.threatType}</Badge>
        )}
        {isEditing ? (
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            disabled={isSaving}
          />
        ) : (
          threat.name
        )}
      </h3>

      <div className="text-xs text-muted-foreground">
        {isEditing ? (
          <Textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="text-xs"
            disabled={isSaving}
          />
        ) : (
          threat.description
        )}
      </div>

      {((actionTaken && !isEditing) || threat.action) && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex w-full cursor-help items-center gap-1 rounded bg-slate-100 p-2 text-xs font-medium text-slate-500">
                <ZapIcon className="h-3 w-3" fill="currentColor" />
                <span className="font-bold">Action taken:</span>{" "}
                {threat.action || actionTaken?.action}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="min-w-56 max-w-56 p-1 text-xs text-slate-500">
                <p>
                  <span className="font-medium">Reason given:</span>{" "}
                  {threat.reason || actionTaken?.reason || "No reason provided"}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <div className="mt-auto">
        <DreadScoreDisplay
          scores={isEditing ? editedDreadScores : threat.dreadScores}
          isEditing={isEditing}
          onScoreChange={handleDreadScoreChange}
          disabled={isSaving}
        />
      </div>
    </div>
  );
};

export default ThreatCard;
