// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.]
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, SearchIcon } from "lucide-react";
import { useState, Suspense } from "react";
import { useLoaderData, Await, Link, useNavigate } from "react-router-dom";
import { DiagramSummary, DiagramStatus } from "@/API";

import {
  Pagination,
  PaginationContent,
  // PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

interface Sort {
  key: keyof DiagramSummary;
  order: "asc" | "desc";
}

const List: React.FC = () => {
  const navigate = useNavigate();
  const loaderData = useLoaderData() as { diagrams: DiagramSummary[] };

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>({ key: "id", order: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const filteredAndSortedDiagrams = (diagramList: DiagramSummary[]) => {
    return diagramList
      .filter((diagram) => {
        const searchValue = search.toLowerCase();
        return (
          diagram.id.toLowerCase().includes(searchValue) ||
          diagram.status.toLowerCase().includes(searchValue) ||
          (diagram.diagramDescription?.toLowerCase().includes(searchValue) ??
            false) ||
          (diagram.userDescription?.toLowerCase().includes(searchValue) ??
            false)
        );
      })
      .sort((a, b) => {
        const aValue = a[sort.key];
        const bValue = b[sort.key];
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sort.order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return 0;
      });
  };

  return (
    <main className="flex-1 p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Threat Models</h1>
          <Suspense
            fallback={
              <Badge>
                <Loader2 className="h-4 w-4 animate-spin" />
              </Badge>
            }
          >
            <Await resolve={loaderData.diagrams}>
              {(resolvedDiagrams: DiagramSummary[]) => (
                <Badge className="bg-primary text-white">
                  {resolvedDiagrams.length}
                </Badge>
              )}
            </Await>
          </Suspense>
        </div>
        <div className="flex gap-4">
          <div className="relative flex-1 md:max-w-xs">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search threat models"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={() => navigate("/create")}>Create new</Button>
        </div>
      </div>
      <Card className="shadow-xl">
        <Suspense fallback={<DataTableSkeleton />}>
          <Await resolve={loaderData.diagrams}>
            {(resolvedDiagrams: DiagramSummary[]) => {
              const filteredDiagrams =
                filteredAndSortedDiagrams(resolvedDiagrams);
              const totalPages = Math.ceil(filteredDiagrams.length / pageSize);
              const paginatedDiagrams = filteredDiagrams.slice(
                (page - 1) * pageSize,
                page * pageSize,
              );

              return (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {(
                          [
                            "id",
                            "status",
                            "diagramDescription",
                            "userDescription",
                          ] as const
                        ).map((key) => (
                          <TableHead
                            key={key}
                            className="cursor-pointer"
                            onClick={() =>
                              setSort({
                                key,
                                order:
                                  sort.key === key
                                    ? sort.order === "asc"
                                      ? "desc"
                                      : "asc"
                                    : "asc",
                              })
                            }
                          >
                            {key.charAt(0).toUpperCase() + key.slice(1)}
                            {sort.key === key && (
                              <span className="ml-1">
                                {sort.order === "asc" ? "\u2191" : "\u2193"}
                              </span>
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDiagrams.map((diagram) => (
                        <TableRow
                          key={diagram.id}
                          className="hover:bg-violet-50"
                        >
                          <TableCell className="font-medium">
                            <Link
                              className="text-violet-600 underline"
                              to={`/view/${diagram.id}`}
                            >
                              {diagram.id}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                diagram.status ===
                                DiagramStatus.GENERATING_THREATS
                                  ? "secondary"
                                  : diagram.status ===
                                      DiagramStatus.THREATS_GENERATED
                                    ? "default"
                                    : "outline"
                              }
                            >
                              {diagram.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {diagram.diagramDescription
                              ? diagram.diagramDescription.length > 50
                                ? `${diagram.diagramDescription.substring(0, 50)}...`
                                : diagram.diagramDescription
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {diagram.userDescription
                              ? diagram.userDescription.length > 50
                                ? `${diagram.userDescription.substring(0, 50)}...`
                                : diagram.userDescription
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <CardFooter className="flex items-center justify-between border-t py-3">
                    <div className="w-full text-sm text-muted-foreground">
                      Showing {(page - 1) * pageSize + 1} to{" "}
                      {Math.min(page * pageSize, filteredDiagrams.length)} of{" "}
                      {filteredDiagrams.length} diagrams
                    </div>
                    <Pagination className="flex justify-end">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            className="cursor-pointer"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                          />
                        </PaginationItem>
                        {/* Add page numbers */}
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1,
                        ).map((pageNumber) => (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              className="cursor-pointer"
                              onClick={() => setPage(pageNumber)}
                              isActive={pageNumber === page}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            className="cursor-pointer"
                            onClick={() =>
                              setPage((p) => Math.min(totalPages, p + 1))
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </CardFooter>
                </>
              );
            }}
          </Await>
        </Suspense>
      </Card>
    </main>
  );
};

interface DataTableSkeletonProps {
  columns?: number;
  rows?: number;
}

export function DataTableSkeleton({
  columns = 4,
  rows = 10,
}: DataTableSkeletonProps) {
  return (
    <div className="p-4">
      <div className="flex flex-col items-center justify-center">
        <div className="flex w-full flex-col items-center gap-2">
          <Skeleton className="h-16 w-full bg-indigo-800 bg-opacity-10" />

          {[...Array(rows)].map((_, rowIndex) => (
            <div key={rowIndex} className="flex w-full gap-2">
              {[...Array(columns)].map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  className="h-10 w-full bg-indigo-800 bg-opacity-10"
                />
              ))}
            </div>
          ))}

          <Skeleton className="h-16 w-full bg-indigo-800 bg-opacity-10" />
        </div>
      </div>
    </div>
  );
}

export default List;
