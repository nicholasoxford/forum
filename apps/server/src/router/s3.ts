import { Elysia, t } from "elysia";
import {
  generatePresignedUrl,
  deleteFile,
  storeMetadata,
} from "../lib/s3-client";

// Environment variables for S3/R2 configuration
interface S3Env {
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_ACCOUNT_ID: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_URL: string;
}

// Get environment variables
const env: S3Env = {
  R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID || "",
  R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY || "",
  R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID || "",
  R2_BUCKET_NAME: process.env.R2_BUCKET_NAME || "",
  R2_PUBLIC_URL: process.env.R2_PUBLIC_URL || "",
};

export const s3Router = new Elysia({ prefix: "/storage" })
  // Generate presigned URL for direct uploads to R2
  .post(
    "/upload-url",
    async ({ body }) => {
      const { key, contentType } = body;
      return await generatePresignedUrl(key, contentType);
    },
    {
      body: t.Object({
        key: t.String(),
        contentType: t.String(),
      }),
    }
  )

  // Store metadata JSON
  .post(
    "/metadata",
    async ({ body }) => {
      try {
        const uri = await storeMetadata(body, body.prefix);
        return { uri };
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Failed to store metadata" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    },
    {
      body: t.Object({
        name: t.String(),
        symbol: t.String(),
        description: t.Optional(t.String()),
        image: t.String(),
        prefix: t.Optional(t.String()),
      }),
    }
  )

  // Delete a file
  .delete(
    "/file",
    async ({ query }) => {
      try {
        await deleteFile(query.url);
        return { success: true };
      } catch (error) {
        return new Response(
          JSON.stringify({ error: "Failed to delete file" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    },
    {
      query: t.Object({
        url: t.String(),
      }),
    }
  )

  // Test S3/R2 connection
  .get("/test-connection", async () => {
    const {
      R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY,
      R2_ACCOUNT_ID,
      R2_BUCKET_NAME,
      R2_PUBLIC_URL,
    } = env;

    // Check if all required environment variables are set
    const isConfigured =
      R2_ACCESS_KEY_ID &&
      R2_SECRET_ACCESS_KEY &&
      R2_ACCOUNT_ID &&
      R2_BUCKET_NAME &&
      R2_PUBLIC_URL;

    if (!isConfigured) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "R2 configuration is incomplete",
          missingEnvs: Object.entries({
            R2_ACCESS_KEY_ID: !!R2_ACCESS_KEY_ID,
            R2_SECRET_ACCESS_KEY: !!R2_SECRET_ACCESS_KEY,
            R2_ACCOUNT_ID: !!R2_ACCOUNT_ID,
            R2_BUCKET_NAME: !!R2_BUCKET_NAME,
            R2_PUBLIC_URL: !!R2_PUBLIC_URL,
          })
            .filter(([_, value]) => !value)
            .map(([key]) => key),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    try {
      // Generate a test presigned URL to verify connection
      const testKey = `test-connection-${Date.now()}`;
      const result = await generatePresignedUrl(testKey, "text/plain");

      return {
        success: true,
        message: "R2 connection successful",
        data: {
          testKey,
          publicUrlBase: R2_PUBLIC_URL,
        },
      };
    } catch (error) {
      console.error("R2 connection test error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: "R2 connection failed",
          error: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  });
