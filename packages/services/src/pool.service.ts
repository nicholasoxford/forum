import { Database, pools, getDb } from "@workspace/db";
import { eq } from "drizzle-orm";
import { NotFoundError } from "elysia";
import { Connection, PublicKey } from "@solana/web3.js";
import { verifySolanaAccount } from "@workspace/vertigo";
import {
  pools as dbPools,
  SelectPool,
  InsertPool,
} from "@workspace/db/src/schema";

export async function getPoolInfo({
  tokenMintAddress,
  db,
  connection,
}: {
  tokenMintAddress: string;
  db: Database;
  connection: Connection;
}) {
  const pool = await db.query.pools.findFirst({
    where: eq(pools.tokenMintAddress, tokenMintAddress),
  });

  if (!pool) {
    throw new NotFoundError("Pool not found");
  }

  // 2. Verify Pool Account On-Chain
  try {
    const poolAccountAddress = new PublicKey(pool.poolAddress);
    await verifySolanaAccount(connection, poolAccountAddress, "Pool Account");
  } catch (verificationError: any) {
    console.error(
      `[instructions/buy] Pool account verification failed: ${verificationError.message}`
    );
    // Propagate the error thrown by verifySolanaAccount
    throw verificationError;
  }
  return pool;
}

/**
 * Fetches pool information from the database by address
 * @param poolAddress The address of the pool to retrieve
 * @returns The pool information if found
 */
export async function getPoolByAddress(
  poolAddress: string
): Promise<SelectPool | null> {
  try {
    const db = getDb();
    // First try to get from database
    const pool = await db.query.pools.findFirst({
      where: eq(dbPools.poolAddress, poolAddress),
    });

    if (pool) {
      return pool;
    }

    // If not in database, we could try to fetch from Vertigo API/SDK
    // This would require integration with Vertigo's API or SDK
    console.log(`Need to fetch pool ${poolAddress} from Vertigo`);

    // For now, return null as we don't have the Vertigo API integrated yet
    return null;
  } catch (error) {
    console.error(`Error fetching pool ${poolAddress}:`, error);
    throw error;
  }
}
