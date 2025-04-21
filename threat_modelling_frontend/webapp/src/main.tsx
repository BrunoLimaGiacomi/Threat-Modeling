// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import React from "react";
import ReactDOM from "react-dom/client";
import {
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";

import "./index.css";

import { RequireAuth } from "@/routes/RequireAuth";
import { Login } from "@/routes/Login";
import { Logout } from "@/routes/Logout";
import Root from "@/routes/Root";
import Errors from "@/routes/Errors";
import List from "@/routes/List";
import Flow from "@/routes/Flow";
import { listDiagramsLoader } from "@/loaders/list-diagrams-loader";

const env = import.meta.env; // Vite environment variables

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: env.VITE_COGNITO_USER_POOL_CLIENT_ID,
      identityPoolId: env.VITE_COGNITO_IDENTITY_POOL_ID,
    },
  },
  API: {
    GraphQL: {
      endpoint: env.VITE_GRAPHQL_ENDPOINT,
      region: env.VITE_AWS_REGION,
      defaultAuthMode: env.VITE_AUTH_MODE,
    },
  },
});

Amplify.configure({
  ...Amplify.getConfig(),
  Storage: {
    S3: {
      region: env.VITE_AWS_REGION,
      bucket: env.VITE_DATA_BUCKET_NAME,
    },
  },
});

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<Errors />}>
      <Route
        element={
          <RequireAuth>
            <Root />
          </RequireAuth>
        }
      >
        <Route index element={<List />} loader={listDiagramsLoader} />
        <Route path="/create" element={<Flow />} />
        <Route path="/view/:modelId" element={<Flow />} />
      </Route>
      <Route path="login" element={<Login />} />
      <Route path="logout" element={<Logout />} />
    </Route>,
  ),
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Authenticator.Provider>
      <RouterProvider router={router} />
    </Authenticator.Provider>
  </React.StrictMode>,
);
