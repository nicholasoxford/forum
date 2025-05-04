import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { telegramRouter } from "./router/telegram";
import { s3Router } from "./router/s3";
import { solanaRouter } from "./router/solana";
import { tokensRouter } from "./router/tokens";
import { instructionsRouter } from "./router/instructions";
import { poolRouter } from "./router/pool";

// Initialize the database

// Use PORT environment variable or fallback to 3000
const port = process.env.PORT ? parseInt(process.env.PORT) : 5050;

const app = new Elysia()
  .use(cors())
  // Apply global Swagger documentation generation
  .use(swagger())
  // Apply global error handler *before* routers
  .onError(({ code, error, set }) => {
    console.error(`[Elysia Error] Code: ${code}, Error:`, error);

    let errorMessage = "An unknown error occurred";
    // Ensure we handle Elysia's error structure and standard Errors
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (
      typeof error === "object" &&
      error !== null &&
      "message" in error
    ) {
      // Handle cases where error might be an object with a message property (like validation errors)
      errorMessage = String(error.message);
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    switch (code) {
      case "VALIDATION":
        set.status = 400;
        return { error: "Validation Error", message: errorMessage };

      case "NOT_FOUND": // Use Elysia's standard NOT_FOUND
        set.status = 404;
        return { error: "Not Found", message: errorMessage };

      case "INTERNAL_SERVER_ERROR":
      case "UNKNOWN":
      default:
        set.status = 500;
        // Avoid exposing raw internal error messages in production if sensitive
        return { error: "Internal Server Error", message: errorMessage };
    }
  })
  .use(telegramRouter)
  .use(s3Router)
  .use(solanaRouter)
  .use(tokensRouter)
  .use(instructionsRouter)
  .use(poolRouter)
  .get("/", () => "Hello Elysia")

  .listen(port);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);

export type App = typeof app;
