import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { telegramRouter } from "./router/telegram";
import { solanaRouter } from "./router/solana";
import { tokensRouter } from "./router/tokens";
import { instructionsRouter } from "./router/instructions";
import { authRouter, protectedRoutes } from "./router/auth";
import { storageRouter } from "./router/storage";
import { tradeStatsRouter } from "./router/trade-stats";
// Use PORT environment variable or fallback to 3000
const port = process.env.PORT ? parseInt(process.env.PORT) : 5050;

const app = new Elysia()
  .use(cors())

  // Apply global Swagger documentation generation
  .use(
    swagger({
      documentation: {
        tags: [
          { name: "Telegram", description: "Telegram related endpoints" },
          { name: "Solana", description: "Solana related endpoints" },
          { name: "Tokens", description: "Tokens related endpoints" },
          {
            name: "Instructions",
            description: "Instructions related endpoints",
          },
          { name: "Auth", description: "Auth related endpoints" },
          { name: "Storage", description: "Storage related endpoints" },
          { name: "Trade Stats", description: "Trading statistics endpoints" },
        ],
      },
    })
  )
  .use(telegramRouter)
  .use(storageRouter)
  .use(solanaRouter)
  .use(tokensRouter)
  .use(instructionsRouter)
  .use(authRouter)
  .use(protectedRoutes)
  .use(tradeStatsRouter)
  .get("/", () => "Hello Elysia")
  .listen(port);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
