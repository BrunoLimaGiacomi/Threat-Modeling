// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.]
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { generateClient } from "aws-amplify/api";
import { listDiagrams } from "@/graphql/queries";
import { ListDiagramsQuery } from "@/API";
import { defer, LoaderFunction } from "react-router-dom";

export const listDiagramsLoader: LoaderFunction = () => {
  const client = generateClient();

  const fetchDiagrams = async () => {
    try {
      const result = await client.graphql<ListDiagramsQuery>({
        query: listDiagrams,
      });

      if ("data" in result && result.data?.listDiagrams) {
        console.log(result.data.listDiagrams);
        return result.data.listDiagrams;
      } else {
        throw new Error("Failed to load diagrams");
      }
    } catch (error) {
      console.error("Error loading diagrams:", error);
      throw error;
    }
  };

  return defer({
    diagrams: fetchDiagrams(),
  });
};
