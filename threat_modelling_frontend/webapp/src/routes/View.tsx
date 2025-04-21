// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.]
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { useParams } from "react-router-dom";

import { useState } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SortAsc,
  SortDesc,
  CheckCircleIcon,
  HammerIcon,
  HandIcon,
  ArrowRightIcon,
  ZapIcon,
  ClockIcon,
  PanelRightOpenIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Component } from "./Create";

type Threat = {
  id: string;
  title: string;
  description: string;
};

export function View() {
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

  const [sortOrder, setSortOrder] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);

  const threats: Threat[] = [
    {
      id: "T00001",
      title: "A title for Threat 1",
      description: "Detailed description for Threat 1",
    },
    {
      id: "T00002",
      title:
        "A title for Threat 2 Lorem ipsum dolor sit, amet consectetur adipisicing elit. Aliquam, maxime d",
      description: "Detailed description for Threat 2",
    },
    {
      id: "T00003",
      title: "A title for Threat 3",
      description:
        "Detailed description for Threat 3 Lorem ipsum dolor sit, amet consectetur adipisicing elit. Aliquam, maxime dolorem dolores eos nemo laudantium temporibus exercitationem, facere fugiat eligendi itaque deleniti explicabo maiores est. Mollitia vero iure eius quo.  ",
    },
    {
      id: "T00004",
      title: "A title for Threat 4",
      description: "Detailed description for Threat 4",
    },
  ];

  const filteredThreats = threats
    .filter((card) =>
      card.title.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) =>
      sortOrder === "asc"
        ? a.id.localeCompare(b.id, undefined, { numeric: true })
        : b.id.localeCompare(a.id, undefined, { numeric: true }),
    );

  const handleAction = (cardId: string, action: string) => {
    console.log(`Card ${cardId}: ${action}`);
    // Implement action logic here
  };

  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex h-screen flex-col">
      <ResizablePanelGroup direction="vertical" className="flex-grow">
        <ResizablePanel defaultSize={30}>
          <div className="flex items-center justify-between pb-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">My Project Name</h2>
                <Badge
                  variant={"secondary"}
                  className="gap-2 rounded-sm bg-white font-mono text-slate-500 shadow-sm hover:bg-white"
                >
                  <span className="font-bold text-blue-600">ID:</span>
                  <span>{id}</span>
                </Badge>
              </div>
              <span className="inline-flex items-center gap-2 text-sm italic text-slate-400">
                <ClockIcon size={14} /> Created 14 hours ago
              </span>
            </div>

            <Sheet>
              <SheetTrigger>
                <Tooltip>
                  <TooltipTrigger>
                    <Button variant={"ghost"}>
                      <PanelRightOpenIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Open project inspector</p>
                  </TooltipContent>
                </Tooltip>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle className="text-2xl font-bold">
                    Inspector
                  </SheetTitle>
                  <SheetDescription>
                    View and edit your project details.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project name</Label>
                    <Input
                      id="project-name"
                      placeholder="My Awesome Architecture"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Lorem Ipsum is simply dummy text of the printing and typesetting industry..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Source diagram</Label>
                    <div className="flex items-center space-x-4 rounded-lg border p-4">
                      <div className="h-16 w-16 rounded bg-slate-200"></div>
                      <div>My Architecture Diagram.png</div>
                    </div>
                  </div>
                  <Button className="w-full">Save & Analyse</Button>
                </div>
                <div className="absolute bottom-4 left-4 text-xs text-slate-500">
                  Brought to you by your friends at PACE
                  <span className="ml-1 rounded bg-slate-200 px-1 py-0.5 text-[10px] font-medium">
                    v1.0
                  </span>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="grid grid-cols-4 gap-3">
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
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={60}>
          <div className="h-full overflow-auto bg-background py-4">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="inline-block text-2xl font-bold">Threats</h2>
              <Badge
                variant="secondary"
                className="h-6 min-w-10 justify-center bg-blue-600 text-sm text-white"
              >
                {`${threats.length < 10 ? 0 : ""}${threats.length}`}
              </Badge>
            </div>
            <div className="mb-4 flex items-center space-x-2">
              <Input
                type="search"
                placeholder="Search threats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                {sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" />
                ) : (
                  <SortDesc className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredThreats.map((threat) => (
                <Sheet key={threat.id}>
                  <SheetTrigger asChild>
                    <Card
                      key={threat.id}
                      onClick={() => setSelectedThreat(threat)}
                    >
                      <CardHeader className="p-4">
                        <CardTitle className="text-md flex gap-2 font-medium">
                          <Badge
                            variant={"secondary"}
                            className="gap-2 rounded-sm bg-white font-mono text-slate-500 shadow-sm hover:bg-white"
                          >
                            <span className="font-bold text-blue-600">
                              ID:{" "}
                            </span>
                            <span>{threat.id}</span>{" "}
                          </Badge>
                          <span className="truncate font-medium">
                            {threat.title}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="truncate text-sm text-slate-400">
                          {threat.description}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" className="font-medium">
                              <ZapIcon className="mr-2 h-5 w-5" />
                              Actions
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={"start"}>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                handleAction(threat.id, "Mitigate")
                              }
                            >
                              <HammerIcon className="mr-3 h-5 w-5" /> Mitigate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => handleAction(threat.id, "Avoid")}
                            >
                              <HandIcon className="mr-3 h-5 w-5" /> Avoid
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() =>
                                handleAction(threat.id, "Mitigate")
                              }
                            >
                              <ArrowRightIcon className="mr-3 h-5 w-5" />{" "}
                              Transfer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={() => handleAction(threat.id, "Ignore")}
                            >
                              <CheckCircleIcon className="mr-3 h-5 w-5" />{" "}
                              Accept/Ignore
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Badge variant={"destructive"} className="uppercase">
                          5.0 high
                        </Badge>
                      </CardFooter>
                    </Card>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>{selectedThreat?.title}</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <p>{selectedThreat?.description}</p>
                    </div>
                  </SheetContent>
                </Sheet>
              ))}
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
