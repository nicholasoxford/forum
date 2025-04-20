import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  // Using wallet address as the primary identifier
  walletAddress: text("wallet_address").primaryKey(),
  // Timestamps for tracking creation
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`) // Use unixepoch() for SQLite timestamps
    .notNull(),
});

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;
