import { Elysia, t } from "elysia";
import { getDb } from "@workspace/db";
import { transactions as txTable } from "@workspace/db/src/schema";
import { eq, and, not, isNull, or } from "drizzle-orm";

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

      // Query transactions with both amountA and amountB for this token
      const txResults = await db
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
        .orderBy(txTable.createdAt);

      // Convert null values to undefined for the response
      const tradeHistory = txResults.map((tx) => ({
        ...tx,
        transactionSignature: tx.transactionSignature ?? undefined,
        amountA: tx.amountA ?? undefined,
        amountB: tx.amountB ?? undefined,
      }));

      // Format the response
      return {
        tokenMint,
        tradeHistory,
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
      200: t.Object({
        tokenMint: t.String(),
        tradeHistory: t.Array(
          t.Object({
            id: t.Number(),
            type: t.String(),
            status: t.String(),
            transactionSignature: t.Optional(t.String()),
            amountA: t.Optional(t.String()),
            amountB: t.Optional(t.String()),
            createdAt: t.Any(),
          })
        ),
      }),
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
