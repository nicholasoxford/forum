import { Elysia } from "elysia";
import { getDb } from "@workspace/db";
import { sql } from "drizzle-orm";
import {
  grindKeypairsWithCli,
  saveKeypairsBatch,
  grindKeypairWithSuffix,
  saveKeypair,
} from "@workspace/services/src/keypair.service";
import { cors } from "@elysiajs/cors";

// Initialize DB connection
const db = getDb();

// Configuration
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const DEFAULT_SUFFIX = process.env.DEFAULT_SUFFIX || "fun";
const BATCH_SIZE = process.env.BATCH_SIZE
  ? parseInt(process.env.BATCH_SIZE)
  : 5;
const GRINDING_INTERVAL_MS = process.env.GRINDING_INTERVAL_MS
  ? parseInt(process.env.GRINDING_INTERVAL_MS)
  : 60000; // Default: 1 minute

// Create Elysia app with basic health endpoint
const app = new Elysia()
  .use(cors())
  .get("/", () => "Keypair Grinding Service")
  .get("/health", () => ({ status: "ok" }))
  .get("/stats", async () => {
    // Get stats about keypairs in the database
    try {
      const suffixes = await db.execute(
        sql`SELECT suffix, COUNT(*) as count, SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used 
            FROM fun_keypairs GROUP BY suffix`
      );

      return {
        status: "ok",
        stats: suffixes,
      };
    } catch (error) {
      console.error("Error fetching stats:", error);
      return {
        status: "error",
        message: "Failed to fetch keypair stats",
      };
    }
  })
  .listen(PORT);

console.log(`🔑 Keypair grinding service running on port ${PORT}`);

/**
 * Main grinding function that runs continuously
 */
async function grindKeypairs() {
  try {
    console.log(
      `Starting grinding for keypairs with suffix: ${DEFAULT_SUFFIX}`
    );

    // Check if Solana CLI is available by trying to use it
    try {
      console.log("Attempting to use Solana CLI for faster grinding...");
      const keypairs = await grindKeypairsWithCli(DEFAULT_SUFFIX, BATCH_SIZE);
      console.log(`Generated ${keypairs.length} keypairs using Solana CLI`);

      // Save the batch to database
      await saveKeypairsBatch(keypairs, DEFAULT_SUFFIX);
      console.log(`Saved ${keypairs.length} keypairs to database`);
    } catch (error) {
      console.warn(
        "Solana CLI not available or failed, falling back to JS implementation"
      );
      console.error(error);

      // Fallback to JS implementation which is slower but more portable
      for (let i = 0; i < BATCH_SIZE; i++) {
        console.log(`Grinding keypair ${i + 1}/${BATCH_SIZE}...`);
        const keypair = grindKeypairWithSuffix(DEFAULT_SUFFIX);
        await saveKeypair(keypair, DEFAULT_SUFFIX);
        console.log(`Saved keypair ${i + 1}: ${keypair.publicKey.toString()}`);
      }
    }
  } catch (error) {
    console.error("Error in grinding process:", error);
  } finally {
    // Schedule next batch
    setTimeout(grindKeypairs, GRINDING_INTERVAL_MS);
  }
}

// Start the grinding process
grindKeypairs();

export type App = typeof app;
