import { NextRequest, NextResponse } from "next/server";
import { S3Client } from "bun";

// Metadata storage interface
interface TokenMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
}

// Initialize S3 client with environment variables
const getS3Client = () => {
  return new S3Client({
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    bucket: process.env.R2_BUCKET_NAME || "",
  });
};

export async function POST(request: NextRequest) {
  try {
    // Parse the JSON body
    const metadata: TokenMetadata = await request.json();

    // Validate metadata
    if (!metadata.name || !metadata.symbol || !metadata.image) {
      return NextResponse.json(
        { error: "Missing required metadata fields" },
        { status: 400 }
      );
    }

    // Generate a unique filename for metadata
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const filename = `metadata/${metadata.symbol.toLowerCase()}-${timestamp}-${randomId}.json`;

    // Upload metadata JSON to R2
    const s3 = getS3Client();

    await s3.write(filename, JSON.stringify(metadata, null, 2), {
      type: "application/json",
      acl: "public-read",
    });

    // Generate the public URI
    const publicUri = `${process.env.R2_PUBLIC_URL}/${filename}`;

    // Return success response with URI
    return NextResponse.json({ uri: publicUri }, { status: 200 });
  } catch (error) {
    console.error("Error storing metadata:", error);
    return NextResponse.json(
      { error: "Failed to store metadata" },
      { status: 500 }
    );
  }
}
