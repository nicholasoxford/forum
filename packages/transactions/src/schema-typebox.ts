import { t } from "elysia";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-typebox";
import { transactions } from "@workspace/db/src/schema";

// Create base schemas from Drizzle tables
export const transactionSelectSchema = createSelectSchema(transactions);
export const transactionInsertSchema = createInsertSchema(transactions);
export const transactionUpdateSchema = createUpdateSchema(transactions);

// Create common types for reuse
const mintAddressType = t.String();
const poolAddressType = t.String();
const amountType = t.Union([t.String(), t.Number()]);
const solMintAddress = "11111111111111111111111111111111";

// Type-specific transaction data schemas
export const buyTransactionDataSchema = t.Object(
  {
    tokenMintAddress: t.Optional(mintAddressType),
    poolAddress: t.Optional(poolAddressType),
    mintA: t.Optional(t.String({ default: solMintAddress })),
    mintB: t.Optional(mintAddressType),
    amount: t.Optional(amountType),
    estimatedAmount: t.Optional(amountType),
  },
  { additionalProperties: true }
);

export const sellTransactionDataSchema = t.Object(
  {
    tokenMintAddress: t.Optional(mintAddressType),
    poolAddress: t.Optional(poolAddressType),
    mintA: t.Optional(t.String({ default: solMintAddress })),
    mintB: t.Optional(mintAddressType),
    amount: t.Optional(amountType),
    estimatedAmount: t.Optional(amountType),
  },
  { additionalProperties: true }
);

export const createPoolTransactionDataSchema = t.Object(
  {
    tokenMintAddress: t.Optional(mintAddressType),
    poolAddress: t.Optional(poolAddressType),
    mintA: t.Optional(t.String({ default: solMintAddress })),
    mintB: t.Optional(mintAddressType),
    initialLiquidity: t.Optional(amountType),
  },
  { additionalProperties: true }
);

export const claimTransactionDataSchema = t.Object(
  {
    tokenMintAddress: t.Optional(mintAddressType),
    poolAddress: t.Optional(poolAddressType),
    mintA: t.Optional(t.String({ default: solMintAddress })),
    estimatedAmount: t.Optional(amountType),
  },
  { additionalProperties: true }
);

export const distributionTransactionDataSchema = t.Object(
  {
    tokenMintAddress: t.Optional(mintAddressType),
    amount: t.Optional(amountType),
    numberOfRecipients: t.Optional(t.Number()),
  },
  { additionalProperties: true }
);

// Transaction type enum
export const transactionTypeEnum = t.Enum({
  buy: "buy",
  sell: "sell",
  create_pool: "create_pool",
  claim: "claim",
  distribute_fees: "distribute_fees",
});

// Transaction data schema with discriminated union for different types
export const transactionDataSchema = t.Union([
  t.Object({
    type: t.Literal("buy"),
    data: buyTransactionDataSchema,
  }),
  t.Object({
    type: t.Literal("sell"),
    data: sellTransactionDataSchema,
  }),
  t.Object({
    type: t.Literal("create_pool"),
    data: createPoolTransactionDataSchema,
  }),
  t.Object({
    type: t.Literal("claim"),
    data: claimTransactionDataSchema,
  }),
  t.Object({
    type: t.Literal("distribute_fees"),
    data: distributionTransactionDataSchema,
  }),
]);

// Schema for the sendAndConfirmWithDatabase endpoint
export const sendAndConfirmSchema = t.Object({
  signature: t.String(),
  type: transactionTypeEnum,
  userWalletAddress: t.String(),
  metadata: t.Optional(t.Object({})),
  txData: t.Optional(t.Object({})),
});

// Response schema for sendAndConfirmWithDatabase
export const sendAndConfirmResponseSchema = t.Object({
  success: t.Boolean(),
  status: t.Union([
    t.Literal("pending"),
    t.Literal("confirmed"),
    t.Literal("failed"),
  ]),
  transactionId: t.Number(),
  signature: t.String(),
  error: t.Optional(t.String()),
});
