import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// --- Users ---
// Represents users interacting with the platform, identified by their Solana wallet address.
export const users = sqliteTable("users", {
  walletAddress: text("wallet_address").primaryKey(), // Solana wallet address
  username: text("username"), // Optional display name
  telegramUserId: text("telegram_user_id"), // Optional Telegram user ID for bot interactions
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

// --- Tokens ---
// Represents all tokens created through the platform.
export const tokens = sqliteTable("tokens", {
  tokenMintAddress: text("token_mint_address").primaryKey(), // Solana token mint address
  tokenSymbol: text("token_symbol").notNull(),
  tokenName: text("token_name").notNull(),
  decimals: integer("decimals").notNull(),
  transferFeeBasisPoints: integer("transfer_fee_basis_points").notNull(),
  maximumFee: text("maximum_fee").notNull(), // Store as string to preserve precision
  metadataUri: text("metadata_uri"),
  targetMarketCap: text("target_market_cap"), // Target market cap as string to preserve precision
  creatorWalletAddress: text("creator_wallet_address")
    .notNull()
    .references(() => users.walletAddress),
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export type InsertToken = typeof tokens.$inferInsert;
export type SelectToken = typeof tokens.$inferSelect;

// --- Pools ---
// Represents Vertigo AMM pools for tokens
export const pools = sqliteTable("pools", {
  poolAddress: text("pool_address").primaryKey(), // Vertigo pool address
  tokenMintAddress: text("token_mint_address")
    .notNull()
    .references(() => tokens.tokenMintAddress), // Associated token
  ownerAddress: text("owner_address").notNull(), // Pool owner address
  mintA: text("mint_a").notNull(), // Usually SOL mint
  mintB: text("mint_b").notNull(), // Token mint (same as tokenMintAddress)
  shift: text("shift").notNull(), // Virtual SOL amount
  initialTokenReserves: text("initial_token_reserves").notNull(),
  royaltiesBps: integer("royalties_bps"), // Royalty basis points
  transactionSignature: text("transaction_signature"), // Creation transaction
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export type InsertPool = typeof pools.$inferInsert;
export type SelectPool = typeof pools.$inferSelect;

// --- GroupChats / Tokens ---
// Represents the core entity: a token gating access to a specific group chat.
export const groupChats = sqliteTable("group_chats", {
  tokenMintAddress: text("token_mint_address")
    .primaryKey()
    .references(() => tokens.tokenMintAddress), // Solana token mint address
  telegramChatId: text("telegram_chat_id").notNull().unique(), // Associated Telegram chat ID
  telegramUsername: text("telegram_username"), // Telegram username for the chat
  tokenSymbol: text("token_symbol").notNull(),
  tokenName: text("token_name").notNull(),
  // Store potentially large/precise token amounts as text
  requiredHoldings: text("required_holdings").notNull(), // Minimum token amount (as string) for access/rewards
  creatorWalletAddress: text("creator_wallet_address").references(
    () => users.walletAddress
  ), // Wallet that created this chat/token
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export type InsertGroupChat = typeof groupChats.$inferInsert;
export type SelectGroupChat = typeof groupChats.$inferSelect;

// --- Memberships ---
// Tracks user membership eligibility in group chats based on token holdings.
// This might be populated/updated by a background process checking on-chain balances.
export const memberships = sqliteTable(
  "memberships",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userWalletAddress: text("user_wallet_address")
      .notNull()
      .references(() => users.walletAddress),
    tokenMintAddress: text("token_mint_address")
      .notNull()
      .references(() => groupChats.tokenMintAddress),
    isEligible: integer("is_eligible", { mode: "boolean" })
      .default(false)
      .notNull(), // Currently meets holding requirement
    lastCheckedAt: integer("last_checked_at", { mode: "timestamp" }), // When eligibility was last verified
    joinedTelegramAt: integer("joined_telegram_at", { mode: "timestamp" }), // When user joined the Telegram chat (if tracked)
    createdAt: integer("created_at", { mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
  },
  (table) => ({
    userChatUnique: uniqueIndex("user_chat_unique_idx").on(
      table.userWalletAddress,
      table.tokenMintAddress
    ),
  })
);

export type InsertMembership = typeof memberships.$inferInsert;
export type SelectMembership = typeof memberships.$inferSelect;

// --- FeeDistributions ---
// Logs the periodic distribution of collected transfer fees.
export const feeDistributions = sqliteTable("fee_distributions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tokenMintAddress: text("token_mint_address")
    .notNull()
    .references(() => groupChats.tokenMintAddress),
  distributionTime: integer("distribution_time", {
    mode: "timestamp",
  }).notNull(),
  // Store potentially large/precise fee amounts as text
  totalFeesDistributed: text("total_fees_distributed").notNull(), // Amount of fee token (as string) distributed
  numberOfRecipients: integer("number_of_recipients").notNull(),
  transactionSignature: text("transaction_signature"), // Optional: Signature of the distribution transaction
  createdAt: integer("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
});

export type InsertFeeDistribution = typeof feeDistributions.$inferInsert;
export type SelectFeeDistribution = typeof feeDistributions.$inferSelect;
