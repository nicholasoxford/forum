import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { telegramRouter } from "./router/telegram";
import { s3Router } from "./router/s3";
import { solanaRouter } from "./router/solana";
import { tokensRouter } from "./router/tokens";
import { instructionsRouter } from "./router/instructions";
import { poolRouter } from "./router/pool";
import { authRouter } from "./router/auth";
// Use PORT environment variable or fallback to 3000
const port = process.env.PORT ? parseInt(process.env.PORT) : 5050;

const app = new Elysia()
  .use(cors())

  // Apply global Swagger documentation generation
  .use(swagger())
  .use(telegramRouter)
  .use(s3Router)
  .use(solanaRouter)
  .use(tokensRouter)
  .use(instructionsRouter)
  .use(poolRouter)
  .use(authRouter)
  .get("/", () => "Hello Elysia")
  .listen(port);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
