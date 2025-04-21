// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { Outlet } from "react-router-dom";
import { NavBar } from "@/components/ui/navbar";
import { TooltipProvider } from "@/components/ui/tooltip";

export const HeaderGradient: React.FC = () => {
  return (
    <div className="absolute inset-0 -z-10 mx-0 max-w-none overflow-hidden">
      <div className="absolute left-1/2 top-0 ml-[-38rem] h-[25rem] w-[81.25rem] dark:[mask-image:linear-gradient(white,transparent)]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ffdf61] to-[#ee54ff] [mask-image:radial-gradient(farthest-side_at_top,white,transparent)]"></div>
        <svg
          viewBox="0 0 1113 440"
          aria-hidden="true"
          className="absolute left-1/2 top-0 ml-[-19rem] w-[69.5625rem] fill-white blur-[30px] dark:hidden"
        >
          <path d="M.016 439.5s-9.5-300 434-300S882.516 20 882.516 20V0h230.004v439.5H.016Z"></path>
        </svg>
      </div>
    </div>
  );
};

export default function Root() {
  return (
    <>
      <TooltipProvider>
        <NavBar />
        <HeaderGradient />
        <main className="container mx-auto mt-4">
          <Outlet />
        </main>
      </TooltipProvider>
    </>
  );
}
