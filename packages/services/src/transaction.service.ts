import { ForumTransactions, TransactionType } from "@workspace/transactions";
import { getDb } from "@workspace/db";
import {
  buyTransactionDataSchema,
  sellTransactionDataSchema,
  createPoolTransactionDataSchema,
  claimTransactionDataSchema,
  distributionTransactionDataSchema,
  createToken2022TransactionDataSchema,
} from "@workspace/transactions/src/schema-typebox";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { launchToken } from "./token.service";

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

  // Create token 2022 transaction handler
  "create-token-2022": async (data, txId) => {
    const db = getDb();
    const transactions = new ForumTransactions(db);

    // Validate data with TypeBox
    if (!Value.Check(createToken2022TransactionDataSchema, data)) {
      const errors = [
        ...Value.Errors(createToken2022TransactionDataSchema, data),
      ];
      throw new Error(
        `Invalid create-token-2022 transaction data: ${errors.map((e) => e.message).join(", ")}`
      );
    }

    // First, update the transaction with the mint address if available
    if (data.tokenMintAddress) {
      await transactions.updateTransactionStatus(txId, "pending", {
        tokenMintAddress: data.tokenMintAddress,
      });
    }

    // After the transaction is confirmed successfully,
    // we'll launch the token with the pool creation, etc.
    // This happens in the confirmation handler
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

// Add a function to handle post-confirmation actions for specific transaction types
export async function handleTransactionConfirmation(
  type: TransactionType,
  txId: number,
  signature: string
): Promise<any> {
  const db = getDb();
  const transactions = new ForumTransactions(db);

  // Get the transaction data
  const transaction = await transactions.getTransactionById(txId);

  if (!transaction) {
    throw new Error(`Transaction ${txId} not found`);
  }

  // Parse metadata if exists
  let metadata = {};
  if (transaction.metadata) {
    try {
      metadata = JSON.parse(transaction.metadata as string);
    } catch (e) {
      console.warn(`Could not parse metadata for transaction ${txId}`);
    }
  }

  // Handle different transaction types
  if (type === "create-token-2022") {
    try {
      // If we have metadata and creator info
      if (metadata && transaction.userWalletAddress) {
        // Type assertion for metadata
        const typedMetadata = metadata as Record<string, any>;

        // Extract mint address - first try from transaction.tokenMintAddress (might be set after transaction)
        // then fall back to metadata.mintAddress which should be returned from the instructions endpoint
        const mintAddress =
          transaction.tokenMintAddress || typedMetadata.mintAddress || "";

        if (!mintAddress) {
          console.error("No mint address found in transaction or metadata");
          throw new Error("Missing mint address required for token launch");
        }

        console.log(
          `[handleTransactionConfirmation] Launching token with mint: ${mintAddress}`
        );

        // Launch the token with pool creation
        const result = await launchToken({
          tokenMintAddress: mintAddress,
          tokenName: typedMetadata.name || "",
          tokenSymbol: typedMetadata.symbol || "",
          decimals: typedMetadata.decimals || 9,
          transferFeeBasisPoints: typedMetadata.transferFeeBasisPoints || 0,
          maximumFee: typedMetadata.maximumFee || "0",
          metadataUri: typedMetadata.uri || "",
          creatorWalletAddress: transaction.userWalletAddress,
          requiredHoldings: typedMetadata.requiredHoldings || "0",
          targetMarketCap: typedMetadata.targetMarketCap || "0",
          creatorUsername: typedMetadata.creatorUsername || "",
          creatorTelegramUserId: typedMetadata.creatorTelegramUserId || "",
        });

        // Update transaction with pool information
        await transactions.updateTransactionStatus(txId, "confirmed", {
          poolAddress: result.poolAddress,
        });

        return result;
      }
    } catch (error) {
      console.error("Error in post-confirmation token creation:", error);
      throw error;
    }
  }

  // Return null for transaction types with no post-confirmation actions
  return null;
}
