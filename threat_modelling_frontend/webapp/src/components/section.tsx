// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.]
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

interface SectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  badge?: string | number;
  headerContent?: ReactNode;
}

const Section: React.FC<SectionProps> = ({
  title,
  icon,
  children,
  badge,
  headerContent,
}) => {
  return (
    <div className="mb-3 flex flex-col items-center gap-3 rounded-lg bg-white p-3 shadow-lg">
      <div className="flex w-full items-center justify-between">
        <div className="inline-flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {icon}
          {title}
          {badge && <Badge>{badge}</Badge>}
        </div>
        {headerContent}
      </div>
      {children}
    </div>
  );
};

export default Section;
