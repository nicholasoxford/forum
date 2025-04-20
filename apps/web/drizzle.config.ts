import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables from .env.local or .env
config({ path: ".env.local" });
config({ path: ".env" });

const tursoUrl = process.env.TURSO_CONNECTION_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN; // Needed as env var for drizzle-kit
console.log("TURSO_AUTH_TOKEN", tursoAuthToken);
console.log("TURSO_CONNECTION_URL", tursoUrl);
if (!tursoUrl) {
  throw new Error(
    "Missing environment variable: TURSO_CONNECTION_URL in drizzle.config.ts"
  );
}

// Drizzle Kit needs the auth token env var even if not specified in dbCredentials below
if (!tursoAuthToken) {
  console.warn(
    "Missing environment variable: TURSO_AUTH_TOKEN in drizzle.config.ts. This is required by drizzle-kit to connect to your remote Turso DB for migrations/push."
  );
  // Depending on your workflow, you might want to throw an error here
  // throw new Error('Missing environment variable: TURSO_AUTH_TOKEN');
}

export default defineConfig({
  schema: "./src/db/schema.ts", // Path to your schema file
  out: "./src/db/migrations", // Directory for migration files
  dialect: "turso", // Specify sqlite dialect for libSQL/Turso
  // driver: 'turso', // Driver is inferred from dbCredentials for Turso
  dbCredentials: {
    url: tursoUrl,
    authToken: tursoAuthToken,
    // authToken is NOT part of dbCredentials schema for sqlite dialect
    // It MUST be provided via the TURSO_AUTH_TOKEN environment variable for drizzle-kit
  },
  // Optional: Enable verbose logging for debugging
  verbose: true,
  // Optional: Strict mode throws errors for potentially unsafe actions
  strict: true,
});
