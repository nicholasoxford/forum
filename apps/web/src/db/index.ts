import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import { config } from "dotenv";
import * as schema from "./schema"; // Import the schema

// Load environment variables from .env.local or .env
config({ path: ".env.local" });
config({ path: ".env" });

const tursoUrl = process.env.TURSO_CONNECTION_URL;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl) {
  throw new Error("Missing environment variable: TURSO_CONNECTION_URL");
}

if (!tursoAuthToken) {
  // While drizzle-kit needs the token env var, the runtime client also needs it to connect.
  throw new Error("Missing environment variable: TURSO_AUTH_TOKEN");
}

const client = createClient({
  url: tursoUrl,
  authToken: tursoAuthToken,
});

// Pass the schema to drizzle for typed queries
export const db = drizzle(client, { schema });

// Optional: You can also export the schema from here if desired
// export * as schema from './schema';
