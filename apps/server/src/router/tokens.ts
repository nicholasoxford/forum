import { Elysia, t } from "elysia";
import { getDb, tokens, pools } from "@workspace/db";
import { eq } from "drizzle-orm";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

export const tokensRouter = new Elysia({ prefix: "/tokens" })
  .get("/", async () => {
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
  })
  .get(
    "/:tokenMint/pool",
    async ({ params }) => {
      try {
        const { tokenMint } = params;

        if (!tokenMint) {
          throw new Error("Token mint address is required");
        }

        // Get token information
        const db = getDb();
        const token = await db.query.tokens.findFirst({
          where: eq(tokens.tokenMintAddress, tokenMint),
        });

        if (!token) {
          throw new Error("Token not found");
        }

        // Get pool information
        const pool = await db.query.pools.findFirst({
          where: eq(pools.tokenMintAddress, tokenMint),
        });

        return {
          success: true,
          token: {
            tokenMintAddress: token.tokenMintAddress,
            tokenSymbol: token.tokenSymbol,
            tokenName: token.tokenName,
            decimals: token.decimals,
            transferFeeBasisPoints: token.transferFeeBasisPoints,
            maximumFee: String(token.maximumFee || "0"),
            metadataUri: token.metadataUri || "",
            targetMarketCap: String(token.targetMarketCap || "0"),
          },
        };
      } catch (error: any) {
        console.error("[tokens/:tokenMint/pool GET]", error);
        throw new Error(error?.message || "Failed to fetch token pool");
      }
    },
    {
      params: t.Object({
        tokenMint: t.String(),
      }),
      response: t.Object({
        success: t.Boolean(),
        token: t.Object({
          tokenMintAddress: t.String(),
          tokenSymbol: t.String(),
          tokenName: t.String(),
          decimals: t.Number(),
          transferFeeBasisPoints: t.Number(),
          maximumFee: t.String(),
          metadataUri: t.String(),
          targetMarketCap: t.String(),
        }),
      }),
    }
  )
  .get(
    "/balance",
    async ({ query }) => {
      try {
        const { wallet, mint } = query;

        if (!wallet || !mint) {
          return new Response(
            JSON.stringify({
              error: "Missing required parameters: wallet and mint",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Validate addresses
        let walletPubkey: PublicKey;
        let mintPubkey: PublicKey;

        try {
          walletPubkey = new PublicKey(wallet);
          mintPubkey = new PublicKey(mint);
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "Invalid wallet or mint address" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Connect to Solana
        const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
        const connection = new Connection(RPC_URL, "confirmed");

        // Find the token account address (ATA)
        const tokenAccountAddress = await getAssociatedTokenAddress(
          mintPubkey,
          walletPubkey,
          false,
          TOKEN_2022_PROGRAM_ID
        );

        let balance;
        // Try to get the token balance
        try {
          balance =
            await connection.getTokenAccountBalance(tokenAccountAddress);
        } catch (error) {
          // If getting the balance fails, the token account might not exist yet
          // which means the user has 0 tokens
          return {
            wallet,
            mint,
            balance: {
              amount: "0",
              decimals: 0,
              uiAmount: 0,
              uiAmountString: "0",
            },
            tokenAccount: tokenAccountAddress.toString(),
            exists: false,
          };
        }

        // Return the balance info
        return {
          wallet,
          mint,
          balance: balance.value,
          tokenAccount: tokenAccountAddress.toString(),
          exists: true,
        };
      } catch (error: any) {
        console.error("[token balance GET]", error);
        return new Response(
          JSON.stringify({
            error: "Failed to get token balance",
            message: error?.message,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    },
    {
      query: t.Object({
        wallet: t.String(),
        mint: t.String(),
      }),
    }
  );
