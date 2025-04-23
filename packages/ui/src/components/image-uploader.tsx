"use client";

import { FC, useState, useRef } from "react";
import { Button } from "./button";

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const API_BASE_URL = "https://forum-lingering-leaf-9073.fly.dev";

interface ImageUploaderProps {
  onImageUpload: (imageUrl: string) => void;
  onError?: (error: Error) => void;
  imageUrl?: string;
  className?: string;
}

export const ImageUploader: FC<ImageUploaderProps> = ({
  onImageUpload,
  onError,
  imageUrl,
  className = "",
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(imageUrl || null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      onError?.(new Error("Please upload an image file"));
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      onError?.(new Error("File size exceeds the 5MB limit"));
      return;
    }

    // Create local preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Generate a unique key for the file
      const key = `uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "")}`;

      // Step 1: Get a presigned URL from our API
      const presignedUrlResponse = await fetch(
        `${API_BASE_URL}/api/upload-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key,
            contentType: file.type,
          }),
        }
      );

      if (!presignedUrlResponse.ok) {
        const errorData = await presignedUrlResponse.json();
        console.error("Upload URL error:", errorData);
        throw new Error(errorData.error || "Failed to get upload URL");
      }

      const { uploadUrl, publicUrl } = await presignedUrlResponse.json();
      console.log("Got presigned URL:", uploadUrl);

      setUploadProgress(25);

      // Step 2: Upload directly to R2 using the presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      console.log("Upload response status:", uploadResponse.status);

      setUploadProgress(75);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Upload failed:", errorText);
        throw new Error(
          `Failed to upload to storage: ${uploadResponse.status} ${errorText}`
        );
      }

      setUploadProgress(100);

      // Step 3: Return the public URL to the parent component
      onImageUpload(publicUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      onError?.(error instanceof Error ? error : new Error("Upload failed"));
      // If upload fails, remove the preview
      if (!imageUrl) {
        setPreviewUrl(null);
      }
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 500); // Reset progress after a small delay
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onImageUpload("");
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        aria-label="Upload image"
      />

      {previewUrl ? (
        <div className="relative w-full aspect-square max-w-[200px] mx-auto">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-cover rounded-lg"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="absolute top-2 right-2"
            onClick={removeImage}
            disabled={isUploading}
          >
            ✕
          </Button>
        </div>
      ) : (
        <div
          onClick={triggerFileInput}
          className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-muted mb-3">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
              <rect x="16" y="5" width="6" height="6" rx="1" />
              <path d="m8 18 4-4 2 2" />
            </svg>
          </div>
          <p className="text-sm font-medium mb-1">
            Drag & drop or click to upload
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG or GIF (max 5MB)
          </p>
        </div>
      )}

      {isUploading && (
        <div className="w-full">
          <p className="text-sm text-center">Uploading...</p>
          <div className="w-full bg-muted rounded-full h-2 mt-1">
            <div
              className="bg-primary h-2 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};
