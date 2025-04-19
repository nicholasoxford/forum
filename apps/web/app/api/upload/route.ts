import { NextRequest, NextResponse } from "next/server";
import { generatePresignedUrl } from "@/lib/s3-client";

// Maximum file size for frontend validation
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
  try {
    // Parse the request JSON
    const data = await request.json();
    const { fileName, contentType } = data;

    // Validate request data
    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "Missing fileName or contentType" },
        { status: 400 }
      );
    }

    // Only allow image uploads
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const extension = fileName.split(".").pop();
    const randomString = Math.random().toString(36).substring(2, 15);
    const key = `uploads/${timestamp}-${randomString}.${extension}`;

    // Generate a presigned URL for direct upload
    try {
      const { uploadUrl, publicUrl } = await generatePresignedUrl(
        key,
        contentType
      );

      // Return the presigned URL and the eventual public URL
      return NextResponse.json(
        {
          uploadUrl,
          publicUrl,
          // Don't include headers since they're already in the presigned URL
        },
        { status: 200 }
      );
    } catch (error: any) {
      console.error("Error generating presigned URL:", error);
      return NextResponse.json(
        {
          error: "Failed to generate upload URL",
          details: error.message,
          key: key,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in upload endpoint:", error);
    return NextResponse.json(
      {
        error: "Failed to process upload request",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Use a POST request size limit of 10MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};
