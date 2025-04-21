// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { useLoaderData, Await } from "react-router-dom";
import { Suspense } from "react";

import { Skeleton } from "@/components/ui/skeleton";

type ItemsData = {
  items: Record<string, string>[];
};

export default function Home() {
  const loaderData = useLoaderData() as ItemsData;

  return (
    <Suspense fallback={<Skeleton />}>
      <Await resolve={loaderData.items} errorElement={<p>Error</p>}>
        {(loadedData) => (
          <div>
            <p>This is a sample rendering with items fetched from an API:</p>
            <pre className="whitespace-pre-wrap rounded-md border border-orange-400 bg-orange-100 p-2 text-xs text-orange-950">
              {JSON.stringify(loadedData, null, 2)}
            </pre>
          </div>
        )}
      </Await>
    </Suspense>
  );
}
