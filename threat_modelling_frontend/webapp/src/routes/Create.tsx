// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.]
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CircleCheckIcon, UploadIcon } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export type Component = {
  id: string;
  name: string;
  description: string;
};

export default function Create() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [diagramImage, setDiagramImage] = useState<File | null>(null);
  const [diagramDescription, setDiagramDescription] = useState("");
  const [components, setComponents] = useState<Component[]>([
    {
      id: "C0001",
      name: "Component 1",
      description: "Component 1 description",
    },
    {
      id: "C0002",
      name: "Component 2",
      description: "Component 2 description",
    },
    {
      id: "C0003",
      name: "Component 3",
      description: "Component 3 description",
    },
    {
      id: "C0004",
      name: "Component 4",
      description: "Component 4 description",
    },
    {
      id: "C0005",
      name: "Component 5",
      description: "Component 5 description",
    },
    {
      id: "C0006",
      name: "Component 6",
      description: "Component 6 description",
    },
  ]);

  const handleNextStep = () => {
    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };

  const handleProjectNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectName(e.target.value);
  };

  const handleProjectDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setProjectDescription(e.target.value);
  };

  const handleDiagramImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files?.length > 0) {
      setDiagramImage(files[0]);
    } else {
      setDiagramImage(null);
    }
  };

  const handleDiagramDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setDiagramDescription(e.target.value);
  };

  const handleComponentEdit = (
    id: string,
    name: string,
    description: string,
  ) => {
    setComponents(
      components.map((component) =>
        component.id == id ? { id, name, description } : component,
      ),
    );
  };

  return (
    <div className="container flex justify-center pt-20">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader>
          {step < 4 && <h1 className="text-2xl font-bold">New Project</h1>}
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid w-full items-center gap-3">
                <Label htmlFor="email">Project name</Label>
                <Input
                  placeholder="My Awesome Architecture"
                  required
                  value={projectName}
                  onChange={handleProjectNameChange}
                />
              </div>

              <div className="grid w-full items-center gap-3">
                <Label htmlFor="email">Project description</Label>
                <Textarea
                  placeholder="A detailed description of you project"
                  required
                  rows={3}
                  value={projectDescription}
                  onChange={handleProjectDescriptionChange}
                />
              </div>
              <div className="grid w-full items-center gap-3">
                <Label htmlFor="diagram-image">Architecture Diagram</Label>
                <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-slate-300 px-6 pb-6 pt-5">
                  {diagramImage ? (
                    <div className="space-y-1 text-center">
                      <img
                        src="/placeholder.svg"
                        alt="Diagram"
                        className="mx-auto max-h-48 w-auto"
                      />
                      <div className="font-medium text-slate-900">
                        {diagramImage.name}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-center">
                      <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
                      <div className="flex text-sm text-slate-600">
                        <label
                          htmlFor="diagram-image"
                          className="hover:text-primary-focus relative cursor-pointer rounded-md bg-white font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
                        >
                          <span>Upload a file</span>
                          <input
                            id="diagram-image"
                            type="file"
                            className="sr-only"
                            onChange={handleDiagramImageChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-slate-500">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <img
                  src="//placehold.it/1920x1080"
                  alt="Diagram"
                  className="mx-auto max-h-96 w-auto rounded-md"
                />
              </div>

              <div className="grid w-full items-center gap-3">
                <Label htmlFor="email">Diagram description</Label>

                <Textarea
                  placeholder="A generated description of you diagram."
                  required
                  rows={3}
                  value={diagramDescription}
                  onChange={handleDiagramDescriptionChange}
                  className="font-mono"
                />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {components.map((component) => (
                  <div
                    key={component.id}
                    className="rounded-md border bg-muted/40 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">{component.name}</h3>
                      <button
                        type="button"
                        className="rounded-md bg-primary px-2 py-1 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        onClick={() =>
                          handleComponentEdit(
                            component.id,
                            component.name,
                            component.description,
                          )
                        }
                      >
                        Edit
                      </button>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {component.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="space-y-4 text-center">
              <CircleCheckIcon className="mx-auto h-14 w-14 text-primary" />
              <h2 className="text-2xl font-bold">Project Created!</h2>
              <p className="text-muted-foreground">
                Your new project has been successfully created.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {(step < 4 && (
            <div className="flex w-full items-center justify-end gap-2">
              <Button
                onClick={handlePreviousStep}
                disabled={step === 1}
                variant={"secondary"}
              >
                Previous
              </Button>

              <Button onClick={handleNextStep}>
                {step === 3 ? "Save components and finish" : "Next"}
              </Button>
            </div>
          )) || (
            <div className="flex w-full justify-center">
              <Button onClick={() => navigate("/view/0001")}>
                Finish and Go to Project
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
