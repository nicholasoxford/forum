import { Elysia, t } from "elysia";
import { getDb } from "@workspace/db";
import { transactions as txTable } from "@workspace/db/src/schema";
import { eq, and, not, isNull, or, desc } from "drizzle-orm";
import { getTokenById } from "@workspace/services"; // Import for direct SOL price fetching
import { NATIVE_MINT } from "@solana/spl-token"; // Import NATIVE_MINT
import { LAMPORTS_PER_SOL } from "@solana/web3.js"; // For converting lamports → SOL
import { TradeStatsResponseSchema } from "@workspace/schemas";

export const tradeStatsRouter = new Elysia({
  prefix: "/trade-stats",
  detail: {
    tags: ["Trade Stats"],
  },
}).get(
  "/:tokenMint",
  async ({ params, set }) => {
    try {
      const { tokenMint } = params;
      const db = getDb();

      if (!tokenMint) {
        set.status = 400;
        throw new Error("Token mint address is required");
      }

      // --- Start of parallel operations ---
      const [txResults, solTokenData, currentTokenData] = await Promise.all([
        db
          .select({
            id: txTable.id,
            type: txTable.type,
            status: txTable.status,
            transactionSignature: txTable.transactionSignature,
            amountA: txTable.amountA,
            amountB: txTable.amountB,
            createdAt: txTable.createdAt,
          })
          .from(txTable)
          .where(
            and(
              eq(txTable.tokenMintAddress, tokenMint),
              eq(txTable.status, "confirmed"),
              not(isNull(txTable.amountA)),
              not(isNull(txTable.amountB)),
              or(eq(txTable.type, "buy"), eq(txTable.type, "sell"))
            )
          )
          .orderBy(desc(txTable.createdAt)), // Sort by newest first
        getTokenById(NATIVE_MINT.toBase58()).catch((error) => {
          console.error("Error fetching SOL price directly:", error);
          return null; // Allow other operations to succeed
        }),
        getTokenById(tokenMint).catch((error) => {
          console.error("Error fetching target token data:", error);
          return null; // Allow other operations to succeed
        }),
      ]);
      // --- End of parallel operations ---

      // Get current SOL price
      let solPrice = null;
      if (solTokenData?.token_info?.price_info?.price_per_token) {
        solPrice = solTokenData.token_info.price_info.price_per_token;
      }

      // Calculate token price if we have transactions
      let latestPrice = null;
      let latestPriceUsd = null;
      let marketCapUsd = null;

      // Fetch target token details for supply and decimals
      let tokenSupply = null;
      let tokenDecimals = 0;
      if (
        currentTokenData?.token_info?.supply &&
        currentTokenData?.token_info?.decimals !== undefined
      ) {
        tokenSupply = BigInt(currentTokenData.token_info.supply);
        tokenDecimals = currentTokenData.token_info.decimals;
      }

      if (txResults.length > 0) {
        /*
         * Instead of relying on a single trade which can be an outlier,
         * calculate a simple volume-weighted average price (VWAP) across
         * the most recent 25 trades (or fewer if less available).
         */

        const sampleWindow = 25;
        const tradesForPrice = txResults.slice(0, sampleWindow);

        let aggregatedSol = 0; // in SOL (not lamports)
        let aggregatedTokens = 0; // in UI token units

        for (const tx of tradesForPrice) {
          const solLamports = parseFloat(tx.amountA || "0");
          const solUi = solLamports / LAMPORTS_PER_SOL;

          const tokenUi =
            parseFloat(tx.amountB || "0") / Math.pow(10, tokenDecimals);

          // Skip obviously bad data
          if (solUi === 0 || tokenUi === 0) continue;

          aggregatedSol += solUi;
          aggregatedTokens += tokenUi;
        }

        if (aggregatedTokens > 0) {
          latestPrice = aggregatedSol / aggregatedTokens;

          if (solPrice !== null) {
            latestPriceUsd = latestPrice * solPrice;

            if (tokenSupply !== null) {
              const supplyAsNumber =
                Number(tokenSupply) / Math.pow(10, tokenDecimals);
              marketCapUsd = latestPriceUsd * supplyAsNumber;
            }
          }
        }
      }

      // Convert null values to undefined for the response fields that expect it (or keep as null)
      // The tradeHistory itself will be sorted newest to oldest based on the query
      const tradeHistory = txResults.map((tx) => ({
        ...tx,
        transactionSignature: tx.transactionSignature ?? undefined,
        amountA: tx.amountA ?? undefined,
        amountB: tx.amountB ?? undefined,
      }));

      // Format the response
      return {
        tokenMint,
        latestPrice, // This can be null
        latestPriceUsd, // This can be null
        solPrice, // This can be null
        marketCapUsd, // Add marketCapUsd to response
        tokenDecimals, // Include token decimals in response
        tradeHistory, // Sorted by newest first
      };
    } catch (error: any) {
      console.error("[trade-stats/:tokenMint GET]", error);
      set.status = 500;
      throw new Error(error?.message || "Failed to fetch trade history");
    }
  },
  {
    params: t.Object({
      tokenMint: t.String(),
    }),
    response: {
      200: TradeStatsResponseSchema,
      400: t.Object({
        error: t.String(),
      }),
      404: t.Object({
        error: t.String(),
      }),
      429: t.Object({
        error: t.String(),
      }),
      500: t.Object({
        error: t.String(),
      }),
    },
  }
);
