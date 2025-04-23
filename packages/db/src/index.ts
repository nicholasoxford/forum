import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Create a function to initialize the database client
export function createDb(config?: { url?: string; authToken?: string }) {
  // Get database connection details from environment variables or config
  const url = config?.url || process.env.TURSO_CONNECTION_URL;
  const authToken = config?.authToken || process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    throw new Error("Database URL is required");
  }

  // Create LibSQL client
  const client = createClient({
    url,
    authToken,
  });

  // Create Drizzle database instance with schema
  return drizzle(client, { schema });
}

// Create a default db instance using environment variables
let _db: ReturnType<typeof createDb> | undefined;

export function getDb() {
  if (!_db) {
    _db = createDb();
  }
  return _db;
}

// Export schema for use elsewhere in the application
export * from "./schema";
