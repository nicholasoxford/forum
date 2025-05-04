import { Elysia, t, NotFoundError } from "elysia";
import { pools, getDb } from "@workspace/db";
import { eq } from "drizzle-orm";
import { PublicKey } from "@solana/web3.js";
import { NATIVE_MINT } from "@solana/spl-token";
import { buyTokens, sellTokens, verifySolanaAccount } from "@workspace/vertigo";
import { createSolanaConnection } from "@workspace/solana";

export const instructionsRouter = new Elysia({ prefix: "/instructions" })
  .post(
    "/buy",
    async ({ body }) => {
      const {
        tokenMintAddress,
        userAddress,
        amount,
        slippageBps = 100, // Default 1% slippage
      } = body;

      // Get pool information from database
      const db = getDb();
      const poolInfo = await db.query.pools.findFirst({
        where: eq(pools.tokenMintAddress, tokenMintAddress),
      });

      if (!poolInfo) {
        throw new NotFoundError("Pool not found for this token");
      }

      console.log(`[instructions/buy] Found pool in DB:`, poolInfo);

      // 2. Verify Pool Account On-Chain
      const connection = await createSolanaConnection();
      try {
        const poolAccountAddress = new PublicKey(poolInfo.poolAddress);
        await verifySolanaAccount(
          connection,
          poolAccountAddress,
          "Pool Account"
        );
      } catch (verificationError: any) {
        console.error(
          `[instructions/buy] Pool account verification failed: ${verificationError.message}`
        );
        // Propagate the error thrown by verifySolanaAccount
        throw verificationError;
      }

      // Get serialized transaction for buying tokens
      try {
        const serializedTx = await buyTokens(connection, {
          poolOwner: poolInfo.ownerAddress,
          mintA: NATIVE_MINT.toString(),
          mintB: tokenMintAddress,
          userAddress,
          amount,
          slippageBps,
        });

        console.log(
          `[instructions/buy] Successfully generated buy transaction for pool: ${poolInfo.poolAddress}`
        );

        return {
          serializedTransaction: serializedTx,
          poolAddress: poolInfo.poolAddress,
        };
      } catch (buyTokensError: any) {
        console.error(
          "[instructions/buy] Error calling buyTokens:",
          buyTokensError
        );
        throw new Error(
          buyTokensError?.message || "Failed to generate buy transaction."
        );
      }
    },
    {
      body: t.Object({
        tokenMintAddress: t.String({
          error: "Token mint address must be a string",
        }),
        userAddress: t.String({ error: "User address must be a string" }),
        amount: t.Number({ error: "Amount must be a number" }),
        slippageBps: t.Optional(
          t.Number({ error: "Slippage must be a number" })
        ),
      }),
      response: {
        200: t.Object({
          serializedTransaction: t.String(),
          poolAddress: t.String(),
        }),
        400: t.Object({
          error: t.String(),
          message: t.String(),
        }),
        404: t.Object({
          error: t.String(),
          message: t.String(),
        }),
        500: t.Object({
          error: t.String(),
          message: t.String(),
        }),
      },
    }
  )
  .post(
    "/sell",
    async ({ body }) => {
      const {
        tokenMintAddress, // This is Mint B for the pool
        userAddress,
        amount, // Amount of token B to sell
        slippageBps = 100, // Default 1% slippage, Vertigo sell currently uses limit=0
      } = body;

      // 1. Get pool information from database
      const db = getDb();
      const poolInfo = await db.query.pools.findFirst({
        where: eq(pools.tokenMintAddress, tokenMintAddress),
      });

      if (!poolInfo) {
        throw new NotFoundError(
          `Pool not found for token mint: ${tokenMintAddress}`
        );
      }

      console.log(`[instructions/sell] Found pool in DB:`, poolInfo);

      // 2. Verify Pool Account On-Chain
      const connection = await createSolanaConnection();
      try {
        const poolAccountAddress = new PublicKey(poolInfo.poolAddress);
        await verifySolanaAccount(
          connection,
          poolAccountAddress,
          "Pool Account"
        );
      } catch (verificationError: any) {
        console.error(
          `[instructions/sell] Pool account verification failed: ${verificationError.message}`
        );
        // Propagate the error thrown by verifySolanaAccount
        throw verificationError;
      }

      // 3. Get serialized transaction for selling tokens
      try {
        const serializedTx = await sellTokens(connection, {
          poolOwner: poolInfo.ownerAddress,
          // Mint A is always SOL in our current setup
          mintA: NATIVE_MINT.toString(),
          mintB: tokenMintAddress,
          userAddress,
          amount, // Amount of token B to sell
          // slippageBps is not directly used in the current sellTokens, uses limit=0
        });

        console.log(
          `[instructions/sell] Successfully generated sell transaction for pool: ${poolInfo.poolAddress}`
        );

        return {
          serializedTransaction: serializedTx,
          poolAddress: poolInfo.poolAddress,
        };
      } catch (sellTokensError: any) {
        console.error(
          "[instructions/sell] Error calling sellTokens:",
          sellTokensError
        );
        // Improve error message clarity
        const detailedMessage =
          sellTokensError?.message || "Failed to generate sell transaction.";
        throw new Error(`Sell token failed: ${detailedMessage}`);
      }
    },
    {
      body: t.Object({
        tokenMintAddress: t.String({
          error: "Token mint address must be a string",
        }),
        userAddress: t.String({ error: "User address must be a string" }),
        amount: t.Number({
          error: "Amount (of token to sell) must be a number",
        }),
        slippageBps: t.Optional(
          t.Number({ error: "Slippage must be a number" })
        ),
      }),
      response: {
        200: t.Object({
          serializedTransaction: t.String(),
          poolAddress: t.String(),
        }),
        // Use t.Object for error responses for consistency
        400: t.Object({
          name: t.String(),
          message: t.String(),
          status: t.Number(),
        }),
        404: t.Object({
          name: t.String(),
          message: t.String(),
          status: t.Number(),
        }),
        500: t.Object({
          name: t.String(),
          message: t.String(),
          status: t.Number(),
        }),
      },
    }
  );
