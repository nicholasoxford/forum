import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

// Create a function to initialize the database client
export function createDb(config?: {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  connectionLimit?: number;
}) {
  // Get database connection details from environment variables or config
  const host = config?.host || process.env.MYSQL_HOST || "localhost";
  const port = config?.port || Number(process.env.MYSQL_PORT) || 3306;
  const user = config?.user || process.env.MYSQL_USER || "non_root_user";
  const password = config?.password || process.env.MYSQL_PASSWORD || "password";
  const database = config?.database || process.env.MYSQL_DATABASE || "some_db";
  const connectionLimit =
    config?.connectionLimit || Number(process.env.MYSQL_CONNECTION_LIMIT) || 10;

  // Create MySQL connection pool with connection limits
  const pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    connectionLimit,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000, // 10 seconds
    waitForConnections: true,
    queueLimit: 0,
  });

  // Handle connection issues with a ping check
  const pingInterval = setInterval(async () => {
    try {
      const conn = await pool.getConnection();
      conn.release();
    } catch (err) {
      console.error("Database connection error:", err);
      // Try to re-establish the connection if needed
      _db = undefined;
      clearInterval(pingInterval);
    }
  }, 60000); // Check connection every minute

  // Create Drizzle database instance with schema
  return drizzle(pool, { schema, mode: "default" });
}

// Create a default db instance using environment variables
let _db: ReturnType<typeof createDb> | undefined;

export function getDb() {
  if (!_db) {
    console.log("Creating new database connection pool");
    _db = createDb();
  }
  return _db;
}

// Export schema for use elsewhere in the application
export * from "./schema";
