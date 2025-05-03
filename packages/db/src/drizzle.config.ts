import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables from .env
dotenv.config();

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url:
      process.env.MYSQL_URL ||
      "mysql://non_root_user:password@localhost:3306/some_db",
  },
  verbose: true,
  strict: true,
});
