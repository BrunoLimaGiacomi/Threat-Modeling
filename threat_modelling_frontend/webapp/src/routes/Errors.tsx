// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { useRouteError, isRouteErrorResponse } from "react-router-dom";

function errorMessage(error: unknown): string {
  if (isRouteErrorResponse(error)) {
    return `${error.status} - ${error.statusText}`;
  } else if (error instanceof Error) {
    return error.message;
  } else if (typeof error === "string") {
    return error;
  } else {
    console.error(error);
    return "Unknown error";
  }
}

const Errors: React.FC = () => {
  const error = useRouteError();

  return (
    <main id="error-page">
      <h3>Oh no!</h3>
      <p>Sorry, an unexpected error has occurred.</p>
      <code>
        <i>{errorMessage(error)}</i>
      </code>

      <footer>Built with ❤️ by PACE</footer>
    </main>
  );
};

export default Errors;
