import { Elysia, t } from "elysia";
import {
  generatePresignedUrl,
  deleteFile,
  storeMetadata,
} from "./lib/s3-client";

import cors from "@elysiajs/cors";
import { getDb, pools, users } from "@workspace/db";

// Initialize the database

// Use PORT environment variable or fallback to 3000
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const app = new Elysia()
  .use(cors())
  .get("/", () => "Hello Elysia")

  // Generate presigned URL for direct uploads to R2
  .post(
    "/api/upload-url",
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
    "/api/metadata",
    async ({ body }) => {
      try {
        const uri = await storeMetadata(body);
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
      }),
    }
  )

  // Delete a file
  .delete(
    "/api/file",
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
  .get("/db", async () => {
    const db = getDb();
    const startTime = performance.now();
    const result = await db.select().from(pools);
    const endTime = performance.now();
    const queryTimeMs = endTime - startTime;

    return {
      queryTimeMs,
      data: result,
    };
  })
  // Get users
  .get("/api/users", async () => {
    try {
      const db = getDb();
      const allUsers = await db.select().from(users);
      return allUsers;
    } catch (error) {
      return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  })

  .listen(port);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
