import { t } from "elysia";

export const TradeStatsResponseSchema = t.Object({
  tokenMint: t.String(),
  latestPrice: t.Union([t.Number(), t.Null()]),
  latestPriceUsd: t.Union([t.Number(), t.Null()]),
  solPrice: t.Union([t.Number(), t.Null()]),
  marketCapUsd: t.Union([t.Number(), t.Null()]),
  tokenDecimals: t.Number(),
  tradeHistory: t.Array(
    t.Object({
      id: t.Number(),
      type: t.String(),
      status: t.String(),
      transactionSignature: t.Optional(t.String()),
      amountA: t.Optional(t.String()),
      amountB: t.Optional(t.String()),
      createdAt: t.Any(), // Consider a more specific type if possible
    })
  ),
});
