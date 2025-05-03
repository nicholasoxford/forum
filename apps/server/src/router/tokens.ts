import { Elysia } from "elysia";
import { getDb, tokens, pools } from "@workspace/db";
import { eq } from "drizzle-orm";

export const tokensRouter = new Elysia({ prefix: "/tokens" }).get(
  "/",
  async () => {
    try {
      const db = getDb();
      // Query all tokens and join with their respective pools
      const allTokens = await db
        .select({
          token: tokens,
          pool: pools,
        })
        .from(tokens)
        .leftJoin(pools, eq(tokens.tokenMintAddress, pools.tokenMintAddress));

      // Format the response
      const formattedTokens = allTokens.map(({ token, pool }) => ({
        // Token info
        tokenMintAddress: token.tokenMintAddress,
        tokenName: token.tokenName,
        tokenSymbol: token.tokenSymbol,
        decimals: token.decimals,
        transferFeeBasisPoints: token.transferFeeBasisPoints,
        metadataUri: token.metadataUri,
        creatorWalletAddress: token.creatorWalletAddress,
        createdAt: token.createdAt,

        // Pool info
        pool: pool
          ? {
              poolAddress: pool.poolAddress,
              ownerAddress: pool.ownerAddress,
              mintA: pool.mintA,
              mintB: pool.mintB,
              shift: pool.shift,
              initialTokenReserves: pool.initialTokenReserves,
              royaltiesBps: pool.royaltiesBps,
            }
          : null,
      }));

      return {
        success: true,
        tokens: formattedTokens,
      };
    } catch (error: any) {
      console.error("[tokens GET]", error);
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: error?.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
);
