import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Get database connection details from environment variables
const url = process.env.TURSO_CONNECTION_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("TURSO_CONNECTION_URL is not set in environment variables");
}

// Create LibSQL client
const client = createClient({
  url,
  authToken,
});

// Create Drizzle database instance with schema
export const db = drizzle(client, { schema });

// Export schema for use elsewhere in the application
export { schema };
