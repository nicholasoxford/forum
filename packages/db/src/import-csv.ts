import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import * as dotenv from "dotenv";
import { createPool } from "mysql2/promise";
import * as schema from "./schema";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";

// Load environment variables
dotenv.config();

// Database connection configuration
const poolConfig = {
  host: process.env.MYSQL_HOST || "localhost",
  port: parseInt(process.env.MYSQL_PORT || "3306"),
  user: process.env.MYSQL_USER || "non_root_user",
  password: process.env.MYSQL_PASSWORD || "password",
  database: process.env.MYSQL_DATABASE || "some_db",
};

async function importCSV() {
  // Create a MySQL pool
  console.log("Connecting to MySQL database...");
  const pool = createPool(poolConfig);
  const db = drizzle(pool, { schema, mode: "default" });

  try {
    // Read and import users.csv
    console.log("Importing users...");
    const usersData = readFileSync("./data/users.csv", "utf8");
    const users = parse(usersData, { columns: true, skip_empty_lines: true });

    for (const user of users) {
      try {
        // Check if user already exists
        const existingUser = await db.query.users.findFirst({
          where: eq(schema.users.walletAddress, user.wallet_address),
        });

        if (!existingUser) {
          await db.insert(schema.users).values({
            walletAddress: user.wallet_address,
            username: user.username === "NULL" ? null : user.username,
            telegramUserId:
              user.telegram_user_id === "NULL" ? null : user.telegram_user_id,
            createdAt: new Date(Number(user.created_at) * 1000), // Convert Unix timestamp to Date
          });
          console.log(`Added user: ${user.wallet_address}`);
        } else {
          console.log(`User already exists: ${user.wallet_address}`);
        }
      } catch (error) {
        console.error(`Error inserting user ${user.wallet_address}:`, error);
      }
    }

    // Read and import tokens.csv
    console.log("Importing tokens...");
    const tokensData = readFileSync("./data/tokens.csv", "utf8");
    const tokens = parse(tokensData, { columns: true, skip_empty_lines: true });

    for (const token of tokens) {
      try {
        // Check if token already exists
        const existingToken = await db.query.tokens.findFirst({
          where: eq(schema.tokens.tokenMintAddress, token.token_mint_address),
        });

        if (!existingToken) {
          await db.insert(schema.tokens).values({
            tokenMintAddress: token.token_mint_address,
            tokenSymbol: token.token_symbol,
            tokenName: token.token_name,
            decimals: parseInt(token.decimals),
            transferFeeBasisPoints: parseInt(token.transfer_fee_basis_points),
            maximumFee: token.maximum_fee,
            metadataUri:
              token.metadata_uri === "NULL" ? null : token.metadata_uri,
            targetMarketCap:
              token.target_market_cap === "NULL"
                ? null
                : token.target_market_cap,
            creatorWalletAddress: token.creator_wallet_address,
            createdAt: new Date(Number(token.created_at) * 1000), // Convert Unix timestamp to Date
          });
          console.log(`Added token: ${token.token_mint_address}`);
        } else {
          console.log(`Token already exists: ${token.token_mint_address}`);
        }
      } catch (error) {
        console.error(
          `Error inserting token ${token.token_mint_address}:`,
          error
        );
      }
    }

    // Read and import pools.csv
    console.log("Importing pools...");
    const poolsData = readFileSync("./data/pools.csv", "utf8");
    const pools = parse(poolsData, { columns: true, skip_empty_lines: true });

    for (const pool of pools) {
      try {
        // Check if pool already exists
        const existingPool = await db.query.pools.findFirst({
          where: eq(schema.pools.poolAddress, pool.pool_address),
        });

        if (!existingPool) {
          await db.insert(schema.pools).values({
            poolAddress: pool.pool_address,
            tokenMintAddress: pool.token_mint_address,
            ownerAddress: pool.owner_address,
            mintA: pool.mint_a,
            mintB: pool.mint_b,
            shift: pool.shift,
            initialTokenReserves: pool.initial_token_reserves,
            royaltiesBps: parseInt(pool.royalties_bps),
            transactionSignature:
              pool.transaction_signature === "NULL"
                ? null
                : pool.transaction_signature,
            createdAt: new Date(Number(pool.created_at) * 1000), // Convert Unix timestamp to Date
          });
          console.log(`Added pool: ${pool.pool_address}`);
        } else {
          console.log(`Pool already exists: ${pool.pool_address}`);
        }
      } catch (error) {
        console.error(`Error inserting pool ${pool.pool_address}:`, error);
      }
    }

    // Read and import group_chats.csv
    console.log("Importing group chats...");
    const groupChatsData = readFileSync("./data/group_chats.csv", "utf8");
    const groupChats = parse(groupChatsData, {
      columns: true,
      skip_empty_lines: true,
    });

    for (const chat of groupChats) {
      try {
        // Check if chat already exists
        const existingChat = await db.query.groupChats.findFirst({
          where: eq(
            schema.groupChats.tokenMintAddress,
            chat.token_mint_address
          ),
        });

        if (!existingChat) {
          await db.insert(schema.groupChats).values({
            tokenMintAddress: chat.token_mint_address,
            telegramChatId:
              chat.telegram_chat_id === "" ? null : chat.telegram_chat_id,
            telegramUsername:
              chat.telegram_username === "NULL" ? null : chat.telegram_username,
            tokenSymbol: chat.token_symbol,
            tokenName: chat.token_name,
            requiredHoldings: chat.required_holdings,
            creatorWalletAddress: chat.creator_wallet_address,
            createdAt: new Date(Number(chat.created_at) * 1000), // Convert Unix timestamp to Date
          });
          console.log(`Added group chat: ${chat.token_mint_address}`);
        } else {
          console.log(`Group chat already exists: ${chat.token_mint_address}`);
        }
      } catch (error) {
        console.error(
          `Error inserting group chat ${chat.token_mint_address}:`,
          error
        );
      }
    }

    console.log("Import completed successfully!");
  } catch (error) {
    console.error("Error during import:", error);
  } finally {
    await pool.end();
  }
}

// Run the import function
importCSV().catch(console.error);
