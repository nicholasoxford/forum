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
import {
  transactions,
  pools,
  tokens,
  users,
  InsertTransaction,
} from "@workspace/db/src/schema";
import { eq, and } from "drizzle-orm";
import { getTokenById } from "./token.service";
import { getPoolByAddress } from "./pool.service";

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
      mintA: data.mintA || "So11111111111111111111111111111111111111112",
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
      mintA: data.mintA || "So11111111111111111111111111111111111111112",
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
      mintA: data.mintA || "So11111111111111111111111111111111111111112",
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
      mintA: data.mintA || "So11111111111111111111111111111111111111112",
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

/**
 * Records or updates a Vertigo buy or sell transaction in the database
 *
 * @param transactionData Data extracted from the Vertigo transaction
 * @returns The transaction record
 */
export async function recordVertigoTransaction(transactionData: {
  signature: string;
  slot: number;
  buyAccounts: {
    pool: string;
    user: string;
    owner: string;
    mint_a: string;
    mint_b: string;
    user_ta_a: string;
    user_ta_b: string;
    vault_a: string;
    vault_b: string;
    token_program_a: string;
    token_program_b: string;
    system_program: string;
    program: string;
    params?: {
      amount: string;
      limit: string;
    };
    tokenChanges?: {
      mintA?: {
        userInput?: string;
        vaultReceived?: string;
        userBalanceChange?: string;
        uiUserBalanceChange?: string;
        decimals: number;
        uiInput?: string;
        uiReceived?: string;
        userReceived?: string;
        vaultSent?: string;
        uiSent?: string;
      };
      mintB?: {
        userReceived?: string;
        vaultSent?: string;
        userBalanceChange?: string;
        uiUserBalanceChange?: string;
        decimals: number;
        uiReceived?: string;
        uiSent?: string;
        userInput?: string;
        vaultReceived?: string;
        uiInput?: string;
      };
    };
  };
  type: "buy" | "sell";
  checkDuplicate?: boolean; // Add optional parameter
}) {
  const db = getDb();

  try {
    // Extract relevant data from the transaction
    const { signature, buyAccounts, type, checkDuplicate } = transactionData;

    const {
      pool: poolAddress,
      user: userWalletAddress,
      mint_a: mintA,
      mint_b: mintB,
    } = buyAccounts;

    // Get token amounts based on transaction type
    let amountA = "";
    let amountB = "";

    console.log(
      `Processing ${type} transaction with token changes:`,
      buyAccounts.tokenChanges
        ? JSON.stringify(buyAccounts.tokenChanges)
        : "none"
    );

    if (type === "buy") {
      // In a buy, user sends mintA (usually SOL) and receives mintB (token)
      amountA =
        buyAccounts.tokenChanges?.mintA?.userInput ||
        buyAccounts.params?.amount ||
        "";
      amountB =
        buyAccounts.tokenChanges?.mintB?.userReceived ||
        // For buy transactions, if userReceived is not available, try userBalanceChange
        // Only use positive balance changes for buy amounts
        (buyAccounts.tokenChanges?.mintB?.userBalanceChange &&
        !buyAccounts.tokenChanges?.mintB?.userBalanceChange.startsWith("-")
          ? buyAccounts.tokenChanges?.mintB?.userBalanceChange
          : "") ||
        "";
    } else if (type === "sell") {
      // In a sell, user sends mintB (token) and receives mintA (usually SOL)
      amountB =
        buyAccounts.tokenChanges?.mintB?.userInput ||
        buyAccounts.params?.amount ||
        "";
      amountA = buyAccounts.tokenChanges?.mintA?.userReceived || "";

      // Fallback to absolute balance changes if input/received not available
      if (!amountB && buyAccounts.tokenChanges?.mintB?.userBalanceChange) {
        const change = buyAccounts.tokenChanges.mintB.userBalanceChange;
        // If negative (user sent tokens), use absolute value
        if (change.startsWith("-")) {
          amountB = change.substring(1); // Remove negative sign
        }
      }

      if (!amountA && buyAccounts.tokenChanges?.mintA?.userBalanceChange) {
        const change = buyAccounts.tokenChanges.mintA.userBalanceChange;
        // If positive (user received tokens), use it
        if (!change.startsWith("-")) {
          amountA = change;
        }
      }
    }

    console.log(
      `Determined amounts for ${type}: amountA=${amountA}, amountB=${amountB}`
    );

    // Calculate fee if available (for future reference)
    // This would need logic specific to how fees are calculated
    const feePaid = "";

    // Prepare metadata from token changes
    const metadata = JSON.stringify({
      params: buyAccounts.params,
      tokenChanges: buyAccounts.tokenChanges,
    });

    // Insert user if not exists (upsert)
    await db
      .insert(users)
      .values({
        walletAddress: userWalletAddress,
        createdAt: new Date(),
      })
      .onDuplicateKeyUpdate({
        set: {
          walletAddress: userWalletAddress, // Update with same value to avoid "No values to set" error
        },
      });

    // Try to fetch token info if not in database
    let tokenExists = true;
    try {
      const tokenCheck = await db.query.tokens.findFirst({
        where: eq(tokens.tokenMintAddress, mintB),
      });

      if (!tokenCheck) {
        tokenExists = false;
        // Try to get token info from Helius
        try {
          const tokenData = await getTokenById(mintB);

          // If we have token data, insert it
          if (tokenData) {
            // Extract data with proper type structure based on HeliusAssetData
            const symbol = tokenData.content?.metadata?.symbol || "UNKNOWN";
            const name = tokenData.content?.metadata?.name || "Unknown Token";

            // Access token_info for decimals
            let decimals = 9; // Default value
            let transferFeeBasisPoints = 0;

            // Handle decimals from token_info
            if (tokenData.token_info?.decimals !== undefined) {
              decimals = tokenData.token_info.decimals;
            }

            // Check for transfer fee in mint_extensions
            if (
              tokenData.mint_extensions?.transfer_fee_config?.newer_transfer_fee
                ?.transfer_fee_basis_points
            ) {
              transferFeeBasisPoints =
                tokenData.mint_extensions.transfer_fee_config.newer_transfer_fee
                  .transfer_fee_basis_points;
            }

            // First ensure the token creator user exists
            await db
              .insert(users)
              .values({
                walletAddress: buyAccounts.owner,
                createdAt: new Date(),
              })
              .onDuplicateKeyUpdate({
                set: {
                  walletAddress: buyAccounts.owner,
                },
              });

            await db.insert(tokens).values({
              tokenMintAddress: mintB,
              tokenSymbol: symbol,
              tokenName: name,
              decimals: decimals,
              transferFeeBasisPoints: transferFeeBasisPoints,
              maximumFee: "0",
              creatorWalletAddress: buyAccounts.owner,
              createdAt: new Date(),
            });

            tokenExists = true;
          }
        } catch (error) {
          console.warn(`Could not fetch token info for ${mintB}:`, error);

          // If we can't get token info from Helius, create a minimal token record with default values
          try {
            // First ensure the token creator user exists
            await db
              .insert(users)
              .values({
                walletAddress: buyAccounts.owner,
                createdAt: new Date(),
              })
              .onDuplicateKeyUpdate({
                set: {
                  walletAddress: buyAccounts.owner,
                },
              });

            // Create a minimal token record
            await db.insert(tokens).values({
              tokenMintAddress: mintB,
              tokenSymbol: mintB.substring(0, 6),
              tokenName: `Token ${mintB.substring(0, 8)}`,
              decimals: buyAccounts.tokenChanges?.mintB?.decimals || 6,
              transferFeeBasisPoints: 0,
              maximumFee: "0",
              creatorWalletAddress: buyAccounts.owner,
              createdAt: new Date(),
            });

            tokenExists = true;
            console.log(`Created minimal token record for ${mintB}`);
          } catch (tokenInsertError) {
            console.error(
              `Failed to create minimal token record: ${tokenInsertError}`
            );
          }
        }
      }
    } catch (error) {
      console.error(`Error checking token ${mintB}:`, error);
    }

    // Try to fetch/create pool info if needed
    let poolCheck = await db.query.pools.findFirst({
      where: eq(pools.poolAddress, poolAddress),
    });
    console.log("POOL CHECK: ", poolCheck);

    if (!poolCheck) {
      // If pool doesn't exist, create a basic record
      try {
        await db.insert(pools).values({
          poolAddress: poolAddress,
          tokenMintAddress: mintB,
          ownerAddress: buyAccounts.owner,
          mintA: mintA,
          mintB: mintB,
          shift: "0", // Default value
          initialTokenReserves: amountB || "0",
          createdAt: new Date(),
        });
      } catch (error) {
        console.warn(`Could not create pool record for ${poolAddress}:`, error);
      }
    }

    // First check if this is a duplicate and we're just checking
    if (checkDuplicate) {
      const existingTransaction = await db.query.transactions.findFirst({
        where: eq(transactions.transactionSignature, signature),
      });

      if (existingTransaction) {
        console.log(`Skipping duplicate transaction: ${signature}`);
        return {
          ...existingTransaction,
          duplicate: true,
        };
      }
    }

    // Prepare transaction data
    const transactionValues: InsertTransaction = {
      type,
      status: "confirmed",
      transactionSignature: signature,
      userWalletAddress,
      tokenMintAddress: mintB,
      poolAddress,
      amountA,
      amountB,
      mintA,
      mintB,
      feePaid,
      metadata,
      createdAt: new Date(),
      confirmedAt: new Date(),
    };

    // Use upsert pattern to either insert a new record or update an existing one
    // This uses ON DUPLICATE KEY UPDATE to handle duplicates at the database level
    try {
      const result = await db
        .insert(transactions)
        .values(transactionValues)
        .onDuplicateKeyUpdate({
          set: {
            // Only update these fields if the record already exists
            tokenMintAddress: mintB,
            poolAddress,
            amountA,
            amountB,
            mintA,
            mintB,
            feePaid,
            metadata,
            status: "confirmed",
            confirmedAt: new Date(),
          },
        });

      // Check if this was an insert or update based on affected rows
      // Access the appropriate property for affected rows based on the Drizzle ORM implementation
      const isUpdate =
        result && "rowsAffected" in result ? result.rowsAffected === 0 : false;

      if (isUpdate) {
        console.log(`Updated existing ${type} transaction: ${signature}`);
      } else {
        console.log(`Recorded new ${type} transaction: ${signature}`);
      }

      console.log(
        `User: ${userWalletAddress}, Amount: ${
          type === "buy"
            ? `${amountA} ${mintA} -> ${amountB} ${mintB}`
            : `${amountB} ${mintB} -> ${amountA} ${mintA}`
        }`
      );

      return {
        ...transactionValues,
        duplicate: isUpdate,
      };
    } catch (error) {
      console.error(`Error upserting transaction: ${error}`);

      // If there was an error with the upsert, try to fetch the existing record
      // This could happen if there's a race condition or constraint violation
      const existingRecord = await db.query.transactions.findFirst({
        where: eq(transactions.transactionSignature, signature),
      });

      if (existingRecord) {
        console.log(`Transaction ${signature} already exists`);
        return {
          ...existingRecord,
          duplicate: true,
        };
      }

      // Re-throw the error if we couldn't find an existing record
      throw error;
    }
  } catch (error) {
    console.error(`Error recording Vertigo transaction:`, error);
    throw error;
  }
}
