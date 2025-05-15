import { z } from "zod";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { transactions } from "@workspace/db/src/schema";

// Create base schemas
export const transactionSelectSchema = createSelectSchema(transactions);
export const transactionInsertSchema = createInsertSchema(transactions);
export const transactionUpdateSchema = createUpdateSchema(transactions);

// Type-specific transaction data schemas
export const buyTransactionDataSchema = z.object({
  tokenMintAddress: z.string(),
  poolAddress: z.string(),
  mintA: z
    .string()
    .optional()
    .default("So11111111111111111111111111111111111111112"), // Default to SOL
  mintB: z.string().optional(),
  amount: z.string().or(z.number()).optional(),
  estimatedAmount: z.string().or(z.number()).optional(),
});

export const sellTransactionDataSchema = z.object({
  tokenMintAddress: z.string(),
  poolAddress: z.string(),
  mintA: z
    .string()
    .optional()
    .default("So11111111111111111111111111111111111111112"), // Default to SOL
  mintB: z.string().optional(),
  amount: z.string().or(z.number()).optional(),
  estimatedAmount: z.string().or(z.number()).optional(),
});

export const createPoolTransactionDataSchema = z.object({
  tokenMintAddress: z.string(),
  poolAddress: z.string(),
  mintA: z
    .string()
    .optional()
    .default("So11111111111111111111111111111111111111112"), // Default to SOL
  mintB: z.string().optional(),
  initialLiquidity: z.string().or(z.number()).optional(),
});

export const claimTransactionDataSchema = z.object({
  tokenMintAddress: z.string(),
  poolAddress: z.string(),
  mintA: z
    .string()
    .optional()
    .default("So11111111111111111111111111111111111111112"), // Default to SOL
  estimatedAmount: z.string().or(z.number()).optional(),
});

export const distributionTransactionDataSchema = z.object({
  tokenMintAddress: z.string(),
  amount: z.string().or(z.number()).optional(),
  numberOfRecipients: z.number().optional(),
});

// Combine all transaction data schemas into a discriminated union
export const transactionDataSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("buy"), data: buyTransactionDataSchema }),
  z.object({ type: z.literal("sell"), data: sellTransactionDataSchema }),
  z.object({
    type: z.literal("create_pool"),
    data: createPoolTransactionDataSchema,
  }),
  z.object({ type: z.literal("claim"), data: claimTransactionDataSchema }),
  z.object({
    type: z.literal("distribute_fees"),
    data: distributionTransactionDataSchema,
  }),
]);

// Types derived from the schemas
export type TransactionSelect = z.infer<typeof transactionSelectSchema>;
export type TransactionInsert = z.infer<typeof transactionInsertSchema>;
export type TransactionUpdate = z.infer<typeof transactionUpdateSchema>;
export type TransactionData = z.infer<typeof transactionDataSchema>;
