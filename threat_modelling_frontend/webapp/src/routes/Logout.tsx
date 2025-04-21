// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { useAuthenticator } from "@aws-amplify/ui-react";
import { Navigate } from "react-router";

export function Logout() {
  const { signOut } = useAuthenticator((context) => [context.route]);
  signOut();

  return <Navigate to={"/login"} replace />;
}
