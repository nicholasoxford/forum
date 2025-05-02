import { Elysia, t } from "elysia";
import cors from "@elysiajs/cors";
import { getDb, pools, users } from "@workspace/db";
import { eq } from "drizzle-orm";
import { telegramRouter } from "./router/telegram";
import { s3Router } from "./router/s3";
import { solanaRouter } from "./router/solana";

// Initialize the database

// Use PORT environment variable or fallback to 3000
const port = process.env.PORT ? parseInt(process.env.PORT) : 5050;

const app = new Elysia()
  .use(cors())
  .use(telegramRouter)
  .use(s3Router)
  .use(solanaRouter)
  .get("/", () => "Hello Elysia")
  .post(
    "/buy",
    async ({ body }) => {
      const { tokenMintAddress, userAddress, amount } = body;
      const db = getDb();
      const pool = await db.query.pools.findFirst({
        where: eq(pools.tokenMintAddress, tokenMintAddress),
      });
    },
    {
      body: t.Object({
        tokenMintAddress: t.String(),
        userAddress: t.String(),
        amount: t.Number(),
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
