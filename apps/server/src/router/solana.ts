import {
  createSolanaConnection,
  initializeUmi,
  waitForSignatureConfirmation,
} from "@workspace/solana";
import { Elysia, env, t } from "elysia";
import { base58, base64 } from "@metaplex-foundation/umi/serializers";
import { HELIUS_API_KEY } from "@workspace/types";
import { ForumTransactions, TransactionType } from "@workspace/transactions";
import { getDb } from "@workspace/db";
import { updateTransactionWithTypeSpecificData } from "@workspace/services/src/transaction.service";
import { parseBuyTransaction } from "@workspace/services/src/buy.service";
import {
  sendAndConfirmSchema,
  sendAndConfirmResponseSchema,
} from "@workspace/transactions/src/schema-typebox";
import ammIdl from "@vertigo-amm/vertigo-sdk/dist/target/idl/amm.json";
import { Amm } from "@vertigo-amm/vertigo-sdk/dist/target/types/amm";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  BN,
  BorshCoder,
  BorshInstructionCoder,
  EventParser,
} from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { NATIVE_MINT } from "@solana/spl-token";
import { getPoolInfo } from "@workspace/services";
import {
  initializeVertigoProgram,
  parseVertigoError,
} from "@workspace/vertigo";
// Elysia now uses TypeBox schemas directly from our schema-typebox file

function stringifyBigInts(obj: any): any {
  if (typeof obj === "bigint") {
    return obj.toString();
  } else if (Array.isArray(obj)) {
    return obj.map(stringifyBigInts);
  } else if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, stringifyBigInts(v)])
    );
  }
  return obj;
}

export const solanaRouter = new Elysia({
  prefix: "/solana",
  detail: {
    tags: ["Solana"],
  },
})
  .get(
    "/parse-tx/:signature",
    async ({ params }) => {
      const umi = initializeUmi();
      const { signature } = params;

      try {
        const b58 = base58.serialize(signature);
        const tx = await umi.rpc.getTransaction(b58, {
          commitment: "confirmed",
        });

        if (!tx) {
          return {
            success: false,
            error: "Transaction not found",
          };
        }

        return parseBuyTransaction(tx);
      } catch (error) {
        console.error("Error parsing transaction:", error);
        return {
          success: false,
          error: "Failed to parse transaction",
          details: error instanceof Error ? error.message : String(error),
        };
      }
    },
    {
      params: t.Object({ signature: t.String() }),
    }
  )
  .post(
    "/wait-for-signature",
    async ({ body }) => {
      const { signature, timeout, interval } = body;

      return waitForSignatureConfirmation({
        signature,
        timeout,
        interval,
        heliusApiKey: HELIUS_API_KEY,
      });
    },
    {
      body: t.Object({
        signature: t.String(),
        timeout: t.Optional(t.Number()),
        interval: t.Optional(t.Number()),
      }),
    }
  )

  .get(
    "/transaction/:id",
    async ({ params }) => {
      const { id } = params;
      const db = getDb();
      const transactions = new ForumTransactions(db);

      try {
        const transaction = await transactions.getTransactionById(Number(id));

        if (!transaction) {
          return {
            success: false,
            transaction: null,
          };
        }

        // Parse metadata if exists
        if (transaction.metadata) {
          try {
            transaction.metadata = JSON.parse(transaction.metadata as string);
          } catch (e) {
            // If JSON parsing fails, keep as string
          }
        }

        return {
          success: true,
          transaction,
        };
      } catch (error) {
        console.error("Error fetching transaction:", error);
        return {
          success: false,
          transaction: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          transaction: t.Any(),
        }),
      },
    }
  )
  .post(
    "/quoteBuy",
    async ({ body }) => {
      const { amount, tokenMintAddress, walletAddress } = body;
      const db = getDb();
      const connection = await createSolanaConnection();
      const program = initializeVertigoProgram(connection);

      const accountLamports = new BN(amount * LAMPORTS_PER_SOL);
      console.log("ABOUT TO QUOTE BUY");
      const poolInfo = await getPoolInfo({
        tokenMintAddress,
        db,
        connection,
      });
      try {
        const quote = await program.methods
          .quoteBuy({
            amount: accountLamports,
            limit: new BN(0),
          })
          .accounts({
            owner: new PublicKey(poolInfo.poolAddress),
            user: new PublicKey(walletAddress),
            mintA: NATIVE_MINT,
            mintB: new PublicKey(tokenMintAddress),
          })
          .view();

        return {
          success: true,
          quote,
          poolInfo,
        };
      } catch (e) {
        console.error("ERROR QUOTING BUY", e);

        let errorMessage = parseVertigoError(e);

        console.log("Returning error:", errorMessage);
        console.log("Pool info:", poolInfo);

        return {
          success: false,
          error: errorMessage,
          poolInfo,
        };
      }
    },
    {
      body: t.Object({
        amount: t.Number({ default: 0.01 }),
        tokenMintAddress: t.String({
          default: "BYr2fwVBFYUSLWokTixJXgihcSckKoioudGY8JeGkTxL",
        }),
        walletAddress: t.String({
          default: "8jTiTDW9ZbMHvAD9SZWvhPfRx5gUgK7HACMdgbFp2tUz",
        }),
      }),
      response: {
        200: t.Object({
          success: t.Boolean(),
          quote: t.Optional(t.Any()),
          error: t.Optional(t.String()),
          poolInfo: t.Any(),
        }),
      },
    }
  )

  .post(
    "/sendAndConfirmWithDatabase",
    async ({ body }) => {
      const { signature, type, userWalletAddress, metadata, txData } = body;
      const db = getDb();
      const transactions = new ForumTransactions(db);

      // Create initial transaction record with pending status
      const transactionRecord = await transactions.createTransaction({
        type: type as TransactionType,
        status: "pending",
        userWalletAddress,
        metadata,
      });

      // Extract the transaction ID - MySQL returns insertId
      const transactionId = transactionRecord.insertId;

      try {
        // Update with transaction-specific data if provided
        if (txData) {
          await updateTransactionWithTypeSpecificData(
            type as TransactionType,
            txData,
            transactionId
          );
        }

        const umi = initializeUmi();
        const deserializedTxAsU8 = base64.serialize(signature);
        const deserializedTx = umi.transactions.deserialize(deserializedTxAsU8);

        // Send transaction to blockchain
        const response = await umi.rpc.sendTransaction(deserializedTx, {
          skipPreflight: true,
        });

        const signatureString = base58.deserialize(response)[0];

        // Update transaction with signature and status
        await transactions.updateTransactionStatus(transactionId, "pending", {
          signature: signatureString,
        });

        // Wait for confirmation
        const confirmation = await waitForSignatureConfirmation({
          signature: signatureString,
          timeout: 60000,
          interval: 200,
          heliusApiKey: HELIUS_API_KEY,
        });

        // Define initial status as pending, will be updated below
        let status: "pending" | "confirmed" | "failed" = "pending";
        let error = "";

        // Update final status based on confirmation result
        if (confirmation.status === "confirmed") {
          status = "confirmed";
          await transactions.updateTransactionStatus(
            transactionId,
            "confirmed"
          );
        } else {
          status = "failed";
          error = confirmation.error || "Transaction failed";
          await transactions.updateTransactionStatus(transactionId, "failed", {
            errorMessage: error,
          });
        }

        return stringifyBigInts({
          success: true,
          status,
          transactionId,
          signature: signatureString,
          error,
          confirmation,
        });
      } catch (error) {
        // Handle errors during transaction processing
        const errorMsg = error instanceof Error ? error.message : String(error);
        await transactions.updateTransactionStatus(transactionId, "failed", {
          errorMessage: errorMsg,
        });

        // Make sure we're returning a signature field, even if it's empty
        // This ensures we match the response schema
        return stringifyBigInts({
          success: false,
          status: "failed",
          error: errorMsg,
          transactionId,
          signature: "", // Empty string for error case
        });
      }
    },
    {
      body: sendAndConfirmSchema,
      response: {
        200: sendAndConfirmResponseSchema,
      },
    }
  );
