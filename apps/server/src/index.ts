import { Elysia, t } from "elysia";
import cors from "@elysiajs/cors";
import { telegramRouter } from "./router/telegram";
import { s3Router } from "./router/s3";
import { solanaRouter } from "./router/solana";
import { tokensRouter } from "./router/tokens";

// Initialize the database

// Use PORT environment variable or fallback to 3000
const port = process.env.PORT ? parseInt(process.env.PORT) : 5050;

const app = new Elysia()
  .use(cors())
  .use(telegramRouter)
  .use(s3Router)
  .use(solanaRouter)
  .use(tokensRouter)
  .get("/", () => "Hello Elysia")

  .listen(port);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
