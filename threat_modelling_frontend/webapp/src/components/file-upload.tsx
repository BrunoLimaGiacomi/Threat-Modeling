// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/
import { Input } from "@/components/ui/input";
import { uploadData } from "aws-amplify/storage";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/loader";
import { CheckCircleIcon, UploadCloudIcon, XCircleIcon } from "lucide-react";
import { getPresignedUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface UploadProps extends HTMLAttributes<HTMLDivElement> {
  onSuccess: (path: string) => void;
  s3Prefix: string;
  disabled?: boolean;
  onFileSelect?: () => void;
}

const FileUpload: React.FC<UploadProps> = ({
  onSuccess,
  s3Prefix = "uploads",
  className,
  disabled = false,
  onFileSelect,
  ...props
}) => {
  const [image, setImage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onFileSelect) onFileSelect();
    const file = e.target.files?.[0];
    if (file) {
      const { name } = file;
      const path = `${s3Prefix}/${name}`;
      try {
        setLoading(true);
        const result = await uploadData({
          path: path,
          data: file,
          options: {
            onProgress: ({ transferredBytes, totalBytes }) => {
              if (totalBytes) {
                const progress = Math.round(
                  (transferredBytes / totalBytes) * 100,
                );
                setProgress(progress);
                console.log(`Upload progress ${progress} %`);
              }
            },
          },
        }).result;
        onSuccess(path);
        setLoading(false);
        console.log("Succeeded: ", result);
        getImage(path);
      } catch (error) {
        setLoading(false);
        setError(error as Error);
        console.log("Error : ", error);
      }
    } else {
      throw new Error("No file selected");
    }
  };

  const getImage = async (path: string) => {
    console.log("getting URL:", path);
    const result = await getPresignedUrl(path);
    console.log("Done:", result);
    setImage(result.url.href);
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg bg-white p-3 shadow-lg lg:w-1/2",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
      {...props}
    >
      {error && !loading && !image && (
        <div className="mt-3 inline-flex items-center gap-2">
          <XCircleIcon className="h-6 w-6 text-red-500" />
          <span className="truncate text-sm font-medium text-slate-900">
            Error uploading the file. Please Try again.
          </span>
        </div>
      )}

      {!image ? (
        <div className="grid items-center gap-3">
          <Label
            htmlFor="upload"
            className={cn(
              "flex items-center gap-2",
              disabled && "cursor-not-allowed",
            )}
          >
            <UploadCloudIcon className="w-6" /> Upload Architecture Diagram
          </Label>
          <Input
            id="upload"
            type="file"
            disabled={loading || disabled}
            onChange={handleFileChange}
            className={disabled ? "cursor-not-allowed" : ""}
          />
          {loading && (
            <div className="mt-3 inline-flex items-center gap-2">
              <LoadingSpinner className="text-violet-600" />
              <span className="truncate text-sm font-medium text-slate-900">
                Uploading... ({progress}%)
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex w-full justify-between gap-4">
          <div className="flex w-full items-center gap-2">
            <CheckCircleIcon className="h-6 w-6 text-green-500" />
            <span className="truncate text-sm font-medium text-slate-900">
              File uploaded successfully!
            </span>
          </div>
          <img
            src={image}
            className="aspect-auto w-16 rounded border-4 border-white shadow"
            alt={"Uploaded image"}
          />
        </div>
      )}
    </div>
  );
};

export default FileUpload;
