import { Database, pools } from "@workspace/db";
import { eq } from "drizzle-orm";
import { NotFoundError } from "elysia";
import { Connection, PublicKey } from "@solana/web3.js";
import { verifySolanaAccount } from "@workspace/vertigo";
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
