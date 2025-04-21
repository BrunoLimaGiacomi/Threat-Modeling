// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.]
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import React from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";

interface DreadScores {
  damage: number;
  reproducibility: number;
  exploitability: number;
  affectedUsers: number;
  discoverability: number;
}

interface DreadScoreDisplayProps {
  scores: DreadScores;
  isEditing?: boolean;
  onScoreChange?: (dimension: string, value: number) => void;
  disabled?: boolean;
  className?: string;
}

const DreadScoreDisplay: React.FC<DreadScoreDisplayProps> = ({
  scores,
  isEditing = false,
  onScoreChange,
  disabled = false,
  className,
  ...props
}) => {
  const scoreItems = [
    { label: "D", value: scores.damage },
    { label: "R", value: scores.reproducibility },
    { label: "E", value: scores.exploitability },
    { label: "A", value: scores.affectedUsers },
    { label: "D", value: scores.discoverability },
  ];

  const getScoreColors = (value: number) => {
    if (value <= 3)
      return {
        text: "text-green-800",
        bg: "bg-green-100",
        border: "border-green-200",
      };
    if (value <= 6)
      return {
        text: "text-amber-800",
        bg: "bg-amber-100",
        border: "border-amber-200",
      };
    return { text: "text-red-800", bg: "bg-red-100", border: "border-red-200" };
  };

  if (isEditing) {
    return (
      <div
        className={cn("flex flex-col gap-1 text-slate-600", className)}
        {...props}
      >
        {Object.entries(scores).map(([dimension, score]) => {
          if (dimension === "__typename") return null;
          const { text, bg, border } = getScoreColors(score as number);
          return (
            <div key={dimension} className="text-xs text-slate-500">
              <div className="flex font-medium">
                {dimension.charAt(0).toUpperCase()}
                {dimension.slice(1)}
              </div>
              <div className="flex justify-between gap-3">
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={[parseInt(score as string)]}
                  onValueChange={(value) =>
                    onScoreChange?.(dimension, value[0])
                  }
                  disabled={disabled}
                />
                <span
                  className={cn(
                    "min-w-8 rounded-md py-1 text-center text-xs font-semibold",
                    text,
                    bg,
                    border,
                  )}
                >
                  {score}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-5 gap-3 text-xs", className)} {...props}>
      {scoreItems.map(({ label, value }) => {
        const { text, bg, border } = getScoreColors(value);
        return (
          <div
            key={`${label}_${value}_${Math.random().toString(36)}`}
            className={cn(
              "flex items-center justify-center gap-1 rounded-full p-1 font-mono",
              bg,
              border,
            )}
          >
            <span className={cn(text, "font-bold")}>{label}:</span>
            <span className={cn(text, "font-bold")}>{value}</span>
          </div>
        );
      })}
    </div>
  );
};

export default DreadScoreDisplay;
