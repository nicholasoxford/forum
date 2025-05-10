import { useState } from "react";
import { server } from "@/utils/elysia";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface UseImageUploadReturn {
  uploadImage: (file: File) => Promise<string>;
  isUploading: boolean;
  uploadProgress: number;
  error: Error | null;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const uploadImage = async (file: File): Promise<string> => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      const err = new Error("Please upload an image file");
      setError(err);
      throw err;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const err = new Error("File size exceeds the 5MB limit");
      setError(err);
      throw err;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      // Generate a unique key for the file
      const key = `uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;

      // Step 1: Get a presigned URL from our API
      const { data: presignedUrlResponse, error: presignedUrlError } =
        await server.storage["upload-url"].post({
          key,
          contentType: file.type,
        });

      if (presignedUrlError) {
        throw new Error(
          presignedUrlError.value.message || "Failed to get upload URL"
        );
      }

      const { uploadUrl, publicUrl } = presignedUrlResponse;
      setUploadProgress(25);

      // Step 2: Upload directly to R2 using the presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      setUploadProgress(75);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(
          `Failed to upload to storage: ${uploadResponse.status} ${errorText}`
        );
      }

      setUploadProgress(100);
      return publicUrl;
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Upload failed");
      setError(err);
      throw err;
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 500); // Reset progress after a small delay
    }
  };

  return {
    uploadImage,
    isUploading,
    uploadProgress,
    error,
  };
};
