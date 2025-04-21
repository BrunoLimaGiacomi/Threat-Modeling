// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.]
// SPDX-License-Identifier: LicenseRef-.amazon.com.-AmznSL-1.0
// Licensed under the Amazon Software License  http://aws.amazon.com/asl/

import { getUrl } from "aws-amplify/storage";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Checks if a value is an object (excluding null). */
const isObject = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};

/**
 * Removes specified keys from an object and all nested objects and arrays.
 * @param data The object or array to remove keys from.
 * @param keysToRemove An array of keys to remove.
 * @returns A new object or array without the specified keys.
 */
export function removeKeys<T>(data: T, keysToRemove: string[]): T {
  if (Array.isArray(data)) {
    return data.map((item) =>
      isObject(item) ? removeKeys(item, keysToRemove) : item,
    ) as T;
  } else if (isObject(data)) {
    const newObj = {} as Record<string, unknown>;

    for (const key in data) {
      if (!keysToRemove.includes(key)) {
        const value = data[key];

        if (Array.isArray(value)) {
          newObj[key] = removeKeys(value, keysToRemove);
        } else if (isObject(value)) {
          newObj[key] = removeKeys(value, keysToRemove);
        } else {
          newObj[key] = value;
        }
      }
    }

    return newObj as T;
  }

  return data;
}

/**
 * Retrieves a presigned URL for an S3 object.
 *
 * @param {string} s3Path - The path of the object in S3.
 * @param {number} [expiresIn=600] - The number of seconds until the presigned URL expires. Defaults to 600 seconds (10 minutes).
 * @returns {Promise<{ url: URL }>} A promise that resolves to an object containing the presigned URL.
 * @throws {Error} If there's an issue generating the presigned URL.
 *
 * @example
 * const result = await getPresignedUrl('uploads/image.jpg', 3600);
 * console.log(result.url.toString()); // Logs the presigned URL
 */

export const getPresignedUrl = async (
  s3Path: string,
  expiresIn: number = 600,
) => {
  const url = await getUrl({
    path: `${s3Path}`,
    options: { expiresIn: expiresIn },
  });
  return url;
};
