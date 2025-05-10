import { ForumTransactions, TransactionType } from "@workspace/transactions";
import { getDb } from "@workspace/db";
import {
  buyTransactionDataSchema,
  sellTransactionDataSchema,
  createPoolTransactionDataSchema,
  claimTransactionDataSchema,
  distributionTransactionDataSchema,
} from "@workspace/transactions/src/schema-typebox";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

// Transaction handlers mapping with type safety
const transactionHandlers: Record<
  TransactionType,
  (data: any, txId: number) => Promise<void>
> = {
  // Buy transaction handler
  buy: async (data, txId) => {
    const db = getDb();
    const transactions = new ForumTransactions(db);

    // Validate data with TypeBox
    if (!Value.Check(buyTransactionDataSchema, data)) {
      const errors = [...Value.Errors(buyTransactionDataSchema, data)];
      throw new Error(
        `Invalid buy transaction data: ${errors.map((e) => e.message).join(", ")}`
      );
    }

    await transactions.updateTransactionStatus(txId, "pending", {
      tokenMintAddress: data.tokenMintAddress,
      poolAddress: data.poolAddress,
      mintA: data.mintA || "11111111111111111111111111111111",
      mintB: data.mintB || data.tokenMintAddress,
      amountA: data.amount?.toString(),
      amountB: data.estimatedAmount?.toString() || data.amount?.toString(),
    });
  },

  // Sell transaction handler
  sell: async (data, txId) => {
    const db = getDb();
    const transactions = new ForumTransactions(db);

    // Validate data with TypeBox
    if (!Value.Check(sellTransactionDataSchema, data)) {
      const errors = [...Value.Errors(sellTransactionDataSchema, data)];
      throw new Error(
        `Invalid sell transaction data: ${errors.map((e) => e.message).join(", ")}`
      );
    }

    await transactions.updateTransactionStatus(txId, "pending", {
      tokenMintAddress: data.tokenMintAddress,
      poolAddress: data.poolAddress,
      mintA: data.mintA || "11111111111111111111111111111111",
      mintB: data.mintB || data.tokenMintAddress,
      amountA: data.estimatedAmount?.toString() || data.amount?.toString(),
      amountB: data.amount?.toString(),
    });
  },

  // Create pool transaction handler
  create_pool: async (data, txId) => {
    const db = getDb();
    const transactions = new ForumTransactions(db);

    // Validate data with TypeBox
    if (!Value.Check(createPoolTransactionDataSchema, data)) {
      const errors = [...Value.Errors(createPoolTransactionDataSchema, data)];
      throw new Error(
        `Invalid create_pool transaction data: ${errors.map((e) => e.message).join(", ")}`
      );
    }

    await transactions.updateTransactionStatus(txId, "pending", {
      tokenMintAddress: data.tokenMintAddress,
      poolAddress: data.poolAddress,
      mintA: data.mintA || "11111111111111111111111111111111",
      mintB: data.mintB || data.tokenMintAddress,
      amountB: data.initialLiquidity?.toString(),
    });
  },

  // Claim transaction handler
  claim: async (data, txId) => {
    const db = getDb();
    const transactions = new ForumTransactions(db);

    // Validate data with TypeBox
    if (!Value.Check(claimTransactionDataSchema, data)) {
      const errors = [...Value.Errors(claimTransactionDataSchema, data)];
      throw new Error(
        `Invalid claim transaction data: ${errors.map((e) => e.message).join(", ")}`
      );
    }

    await transactions.updateTransactionStatus(txId, "pending", {
      tokenMintAddress: data.tokenMintAddress,
      poolAddress: data.poolAddress,
      mintA: data.mintA || "11111111111111111111111111111111",
      amountA: data.estimatedAmount?.toString(),
    });
  },

  // Distribute fees transaction handler
  distribute_fees: async (data, txId) => {
    const db = getDb();
    const transactions = new ForumTransactions(db);

    // Validate data with TypeBox
    if (!Value.Check(distributionTransactionDataSchema, data)) {
      const errors = [...Value.Errors(distributionTransactionDataSchema, data)];
      throw new Error(
        `Invalid distribute_fees transaction data: ${errors.map((e) => e.message).join(", ")}`
      );
    }

    await transactions.updateTransactionStatus(txId, "pending", {
      tokenMintAddress: data.tokenMintAddress,
      amountB: data.amount?.toString(),
    });
  },
};

export async function updateTransactionWithTypeSpecificData(
  type: TransactionType,
  data: any,
  txId: number
): Promise<void> {
  try {
    // Check if handler exists for this transaction type
    if (transactionHandlers[type]) {
      await transactionHandlers[type](data, txId);
    } else {
      console.warn(`No transaction handler found for type: ${type}`);
    }
  } catch (error) {
    // Handle validation errors
    console.error(`Error validating ${type} transaction data:`, error);
    throw new Error(
      `Invalid transaction data for type ${type}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
