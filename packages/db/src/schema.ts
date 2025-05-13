import {
  mysqlTable,
  varchar,
  int,
  timestamp,
  uniqueIndex,
  boolean,
  foreignKey,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// --- Users ---
// Represents users interacting with the platform, identified by their Solana wallet address.
export const users = mysqlTable("users", {
  walletAddress: varchar("wallet_address", { length: 255 }).primaryKey(), // Solana wallet address
  username: varchar("username", { length: 255 }), // Optional display name
  telegramUserId: varchar("telegram_user_id", { length: 255 }), // Optional Telegram user ID for bot interactions
  createdAt: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

// --- Tokens ---
// Represents all tokens created through the platform.
export const tokens = mysqlTable(
  "tokens",
  {
    tokenMintAddress: varchar("token_mint_address", {
      length: 255,
    }).primaryKey(), // Solana token mint address
    tokenSymbol: varchar("token_symbol", { length: 50 }).notNull(),
    tokenName: varchar("token_name", { length: 255 }).notNull(),
    decimals: int("decimals").notNull(),
    transferFeeBasisPoints: int("transfer_fee_basis_points").notNull(),
    maximumFee: varchar("maximum_fee", { length: 255 }).notNull(), // Store as string to preserve precision
    metadataUri: varchar("metadata_uri", { length: 255 }),
    targetMarketCap: varchar("target_market_cap", { length: 255 }), // Target market cap as string to preserve precision
    creatorWalletAddress: varchar("creator_wallet_address", {
      length: 255,
    }).notNull(),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.creatorWalletAddress],
      foreignColumns: [users.walletAddress],
      name: "tokens_creator_fk",
    }),
    index("tokens_mint_idx").on(table.tokenMintAddress),
  ]
);

export type InsertToken = typeof tokens.$inferInsert;
export type SelectToken = typeof tokens.$inferSelect;

// --- Pools ---
// Represents Vertigo AMM pools for tokens
export const pools = mysqlTable(
  "pools",
  {
    poolAddress: varchar("pool_address", { length: 255 }).primaryKey(), // Vertigo pool address
    tokenMintAddress: varchar("token_mint_address", { length: 255 }).notNull(),
    ownerAddress: varchar("owner_address", { length: 255 }).notNull(), // Pool owner address
    mintA: varchar("mint_a", { length: 255 }).notNull(), // Usually SOL mint
    mintB: varchar("mint_b", { length: 255 }).notNull(), // Token mint (same as tokenMintAddress)
    shift: varchar("shift", { length: 255 }).notNull(), // Virtual SOL amount
    initialTokenReserves: varchar("initial_token_reserves", {
      length: 255,
    }).notNull(),
    royaltiesBps: int("royalties_bps"), // Royalty basis points
    transactionSignature: varchar("transaction_signature", { length: 255 }), // Creation transaction
    privilegedBuyerSignature: varchar("privileged_buyer_signature", {
      length: 255,
    }), // Privileged buyer transaction
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.tokenMintAddress],
      foreignColumns: [tokens.tokenMintAddress],
      name: "pools_token_fk",
    }),
    index("pools_token_mint_idx").on(table.tokenMintAddress),
  ]
);

export type InsertPool = typeof pools.$inferInsert;
export type SelectPool = typeof pools.$inferSelect;

// --- GroupChats / Tokens ---
// Represents the core entity: a token gating access to a specific group chat.
export const groupChats = mysqlTable(
  "group_chats",
  {
    tokenMintAddress: varchar("token_mint_address", {
      length: 255,
    }).primaryKey(),
    telegramChatId: varchar("telegram_chat_id", { length: 255 })
      .notNull()
      .unique(), // Associated Telegram chat ID
    telegramUsername: varchar("telegram_username", { length: 255 }), // Telegram username for the chat
    tokenSymbol: varchar("token_symbol", { length: 50 }).notNull(),
    tokenName: varchar("token_name", { length: 255 }).notNull(),
    // Store potentially large/precise token amounts as text
    requiredHoldings: varchar("required_holdings", { length: 255 }).notNull(), // Minimum token amount (as string) for access/rewards
    creatorWalletAddress: varchar("creator_wallet_address", { length: 255 }),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.tokenMintAddress],
      foreignColumns: [tokens.tokenMintAddress],
      name: "groupchats_token_fk",
    }),
    foreignKey({
      columns: [table.creatorWalletAddress],
      foreignColumns: [users.walletAddress],
      name: "groupchats_creator_fk",
    }),
  ]
);

export type InsertGroupChat = typeof groupChats.$inferInsert;
export type SelectGroupChat = typeof groupChats.$inferSelect;

// --- Memberships ---
// Tracks user membership eligibility in group chats based on token holdings.
// This might be populated/updated by a background process checking on-chain balances.
export const memberships = mysqlTable(
  "memberships",
  {
    id: int("id").autoincrement().primaryKey(),
    userWalletAddress: varchar("user_wallet_address", {
      length: 255,
    }).notNull(),
    tokenMintAddress: varchar("token_mint_address", { length: 255 }).notNull(),
    isEligible: boolean("is_eligible").default(false).notNull(), // Currently meets holding requirement
    lastCheckedAt: timestamp("last_checked_at"), // When eligibility was last verified
    joinedTelegramAt: timestamp("joined_telegram_at"), // When user joined the Telegram chat (if tracked)
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_chat_unique_idx").on(
      table.userWalletAddress,
      table.tokenMintAddress
    ),
    foreignKey({
      columns: [table.userWalletAddress],
      foreignColumns: [users.walletAddress],
      name: "memberships_user_fk",
    }),
    foreignKey({
      columns: [table.tokenMintAddress],
      foreignColumns: [groupChats.tokenMintAddress],
      name: "memberships_token_fk",
    }),
  ]
);

export type InsertMembership = typeof memberships.$inferInsert;
export type SelectMembership = typeof memberships.$inferSelect;

// --- FeeDistributions ---
// Logs the periodic distribution of collected transfer fees.
export const feeDistributions = mysqlTable(
  "fee_distributions",
  {
    id: int("id").autoincrement().primaryKey(),
    tokenMintAddress: varchar("token_mint_address", { length: 255 }).notNull(),
    distributionTime: timestamp("distribution_time").notNull(),
    // Store potentially large/precise fee amounts as text
    totalFeesDistributed: varchar("total_fees_distributed", {
      length: 255,
    }).notNull(), // Amount of fee token (as string) distributed
    numberOfRecipients: int("number_of_recipients").notNull(),
    transactionSignature: varchar("transaction_signature", { length: 255 }), // Optional: Signature of the distribution transaction
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.tokenMintAddress],
      foreignColumns: [groupChats.tokenMintAddress],
      name: "fee_dist_token_fk",
    }),
  ]
);

export type InsertFeeDistribution = typeof feeDistributions.$inferInsert;
export type SelectFeeDistribution = typeof feeDistributions.$inferSelect;

// --- Transactions ---
// Records all transactions performed on the platform, including creating pools, buying/selling tokens,
// claiming royalties, and distributing fees.
export const transactions = mysqlTable(
  "transactions",
  {
    id: int("id").autoincrement().primaryKey(),
    type: varchar("type", { length: 50 }).notNull(), // "create_pool", "buy", "sell", "claim", "distribute_fees"
    status: varchar("status", { length: 20 }).notNull().default("pending"), // "pending", "confirmed", "failed"
    transactionSignature: varchar("transaction_signature", { length: 255 }), // Solana transaction signature when available
    userWalletAddress: varchar("user_wallet_address", {
      length: 255,
    }).notNull(),
    tokenMintAddress: varchar("token_mint_address", { length: 255 }),
    poolAddress: varchar("pool_address", { length: 255 }),
    amountA: varchar("amount_a", { length: 255 }), // Amount of token A (usually SOL) involved in the transaction
    amountB: varchar("amount_b", { length: 255 }), // Amount of token B (usually the project token) involved
    mintA: varchar("mint_a", { length: 255 }), // Mint address of token A
    mintB: varchar("mint_b", { length: 255 }), // Mint address of token B
    feePaid: varchar("fee_paid", { length: 255 }), // Fee paid in the transaction (if any)
    metadata: varchar("metadata", { length: 1024 }), // Additional JSON data specific to the transaction type
    errorMessage: varchar("error_message", { length: 1024 }), // Error details if transaction failed
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    confirmedAt: timestamp("confirmed_at"),
  },
  (table) => [
    foreignKey({
      columns: [table.userWalletAddress],
      foreignColumns: [users.walletAddress],
      name: "tx_user_fk",
    }),
    foreignKey({
      columns: [table.tokenMintAddress],
      foreignColumns: [tokens.tokenMintAddress],
      name: "tx_token_fk",
    }),
    foreignKey({
      columns: [table.poolAddress],
      foreignColumns: [pools.poolAddress],
      name: "tx_pool_fk",
    }),
  ]
);

export type InsertTransaction = typeof transactions.$inferInsert;
export type SelectTransaction = typeof transactions.$inferSelect;

// --- FunKeypairs ---
// Stores pre-generated keypairs with "fun" addresses to be used for token mints
export const funKeypairs = mysqlTable(
  "fun_keypairs",
  {
    id: int("id").autoincrement().primaryKey(),
    publicKey: varchar("public_key", { length: 255 }).notNull().unique(),
    privateKey: varchar("private_key", { length: 1024 }).notNull(), // Store encrypted if possible in production
    suffix: varchar("suffix", { length: 255 }).notNull(), // What makes this address "fun" (e.g., "fun", "sol", etc.)
    isUsed: boolean("is_used").default(false).notNull(),
    usedByTokenMint: varchar("used_by_token_mint", { length: 255 }),
    createdAt: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    usedAt: timestamp("used_at"),
  },
  (table) => [
    index("fun_keypairs_suffix_idx").on(table.suffix),
    index("fun_keypairs_used_idx").on(table.isUsed),
  ]
);

export type InsertFunKeypair = typeof funKeypairs.$inferInsert;
export type SelectFunKeypair = typeof funKeypairs.$inferSelect;
