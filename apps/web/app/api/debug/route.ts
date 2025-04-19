import { NextRequest, NextResponse } from "next/server";
import { S3Client } from "bun";

export async function GET(request: NextRequest) {
  // Get environment variables (mask secrets partially)
  const envVars = {
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID
      ? `${process.env.R2_ACCESS_KEY_ID.substring(0, 4)}...${process.env.R2_ACCESS_KEY_ID.substring(process.env.R2_ACCESS_KEY_ID.length - 4)}`
      : "NOT SET",
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY
      ? `${process.env.R2_SECRET_ACCESS_KEY.substring(0, 4)}...${process.env.R2_SECRET_ACCESS_KEY.substring(process.env.R2_SECRET_ACCESS_KEY.length - 4)}`
      : "NOT SET",
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || "NOT SET",
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || "NOT SET",
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || "NOT SET",
  };

  // Test S3 connection
  let s3Test: {
    success: boolean;
    error: string | null;
    bucketExists: boolean;
    presignedUrl?: string;
  } = {
    success: false,
    error: null,
    bucketExists: false,
  };

  try {
    const s3 = new S3Client({
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      bucket: process.env.R2_BUCKET_NAME || "",
    });

    // Try to list objects to check connection
    try {
      await s3.list({ maxKeys: 1 });
      s3Test.bucketExists = true;
    } catch (error: any) {
      s3Test.bucketExists = false;
      s3Test.error = `Bucket error: ${error.message}`;
    }

    // Generate a test presigned URL
    try {
      const testKey = "test-file.txt";
      const uploadUrl = s3.presign(testKey, {
        method: "PUT",
        expiresIn: 60 * 10, // 10 minutes
        acl: "public-read",
      });

      s3Test.success = true;
      s3Test.presignedUrl = uploadUrl;
    } catch (error: any) {
      s3Test.success = false;
      s3Test.error = `Presigned URL error: ${error.message}`;
    }
  } catch (error: any) {
    s3Test.error = `S3 client error: ${error.message}`;
  }

  return NextResponse.json({
    envVars,
    s3Test,
    instructions:
      "Make a PUT request to the presignedUrl with Content-Type: text/plain and a text body to test",
  });
}
