import { S3Client } from "bun";

// Initialize S3 client with environment variables
const getS3Client = () => {
  // Validate environment variables
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const accountId = process.env.R2_ACCOUNT_ID;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accessKeyId || !secretAccessKey || !accountId || !bucketName) {
    throw new Error("Missing R2 configuration in environment variables");
  }

  // Create the S3 client with Cloudflare R2 configuration
  return new S3Client({
    accessKeyId,
    secretAccessKey,
    bucket: bucketName,
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    region: "auto", // R2 requires region: "auto"
  });
};

/**
 * Generate a presigned URL for uploading a file directly to R2
 * @param key The key/path for the file
 * @param contentType The content type of the file
 * @returns Object containing the presigned URL and the file's public URL
 */
export async function generatePresignedUrl(
  key: string,
  contentType: string
): Promise<{
  uploadUrl: string;
  publicUrl: string;
}> {
  try {
    const s3 = getS3Client();

    // Generate a presigned URL for uploading
    const uploadUrl = s3.presign(key, {
      method: "PUT",
      expiresIn: 60 * 10, // 10 minutes
      // Don't set acl in presign options for R2
    });

    // Return both the upload URL and the final public URL
    const publicDomain = process.env.R2_PUBLIC_URL;
    const publicUrl = `${publicDomain}/${key}`;

    return {
      uploadUrl,
      publicUrl,
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error("Failed to generate upload URL");
  }
}

/**
 * Delete a file from R2 storage
 * @param fileUrl URL of the file to delete
 */
export async function deleteImage(fileUrl: string): Promise<void> {
  try {
    const s3 = getS3Client();

    // Extract the key from the URL
    const publicDomain = process.env.R2_PUBLIC_URL;
    const key = fileUrl.replace(`${publicDomain}/`, "");

    await s3.delete(key);
  } catch (error) {
    console.error("Error deleting from R2:", error);
    throw new Error("Failed to delete image");
  }
}
