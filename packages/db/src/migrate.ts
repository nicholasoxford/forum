import { migrate } from "drizzle-orm/mysql2/migrator";
import { createDb } from "./index";

// This script can be run to apply migrations programmatically
async function main() {
  console.log("Running migrations...");

  const db = createDb();

  // This will run migrations from the specified folder
  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log("Migrations completed!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed!");
  console.error(err);
  process.exit(1);
});
