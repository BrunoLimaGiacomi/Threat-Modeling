// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { useLocation, Navigate } from "react-router-dom";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { ReactNode } from "react";

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { route } = useAuthenticator((context) => [context.route]);
  if (route !== "authenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
