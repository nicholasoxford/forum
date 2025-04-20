import { createClient } from "@libsql/client";
import fs from "fs";
import path from "path";

// Environment variables will be loaded by Bun with --env-file=.env.local

const TURSO_AUTH_TOKEN: string | undefined = process.env.TURSO_AUTH_TOKEN;
const TURSO_CONNECTION_URL: string | undefined =
  process.env.TURSO_CONNECTION_URL;

if (!TURSO_AUTH_TOKEN || !TURSO_CONNECTION_URL) {
  console.error(
    "Missing required environment variables: TURSO_AUTH_TOKEN or TURSO_CONNECTION_URL"
  );
  process.exit(1);
}

// At this point, we know these values are defined
const authToken: string = TURSO_AUTH_TOKEN;
const connectionUrl: string = TURSO_CONNECTION_URL;

async function runMigration(): Promise<void> {
  try {
    // Create a client
    const client = createClient({
      url: connectionUrl,
      authToken: authToken,
    });

    // Read the migration file
    const migrationPath = path.join(
      process.cwd(),
      "src",
      "db",
      "migrations",
      "0002_add_tokens_table.sql"
    );
    const migrationSql = fs.readFileSync(migrationPath, "utf8");

    // Split the SQL into individual statements
    const statements: string[] = migrationSql
      .split(";")
      .map((statement) => statement.trim())
      .filter((statement) => statement.length > 0);

    console.log(`Running migration with ${statements.length} statements...`);

    // Execute each statement separately
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue; // Skip if statement is undefined

      console.log(`Executing statement ${i + 1}/${statements.length}:`);
      console.log(
        statement.substring(0, 100) + (statement.length > 100 ? "..." : "")
      );

      try {
        await client.execute(statement);
        console.log(`Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        throw error;
      }
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
