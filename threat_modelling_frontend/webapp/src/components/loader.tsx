// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.]
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { cn } from "@/lib/utils";

interface LoaderProps {
  message: string;
  className?: string;
}

const Loader: React.FC<LoaderProps> = ({ message, className }) => (
  <div
    className={cn(
      "mb-3 flex flex-col items-center gap-3 rounded-lg bg-white p-3 shadow-lg",
      className,
    )}
  >
    <div className="flex items-center gap-2">
      <LoadingSpinner className="text-violet-600" />
      <span className="truncate text-sm font-medium text-slate-900">
        {message}
      </span>
    </div>
  </div>
);

export interface ISVGProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

export const LoadingSpinner = ({
  size = 24,
  className,
  ...props
}: ISVGProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("animate-spin", className)}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
};

export default Loader;
