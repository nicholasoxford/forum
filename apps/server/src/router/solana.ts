import { initializeUmi, waitForSignatureConfirmation } from "@workspace/solana";
import { Elysia, env, t } from "elysia";
import { base58, base64 } from "@metaplex-foundation/umi/serializers";
import { HELIUS_API_KEY } from "@workspace/types";
import { ForumTransactions, TransactionType } from "@workspace/transactions";
import { getDb } from "@workspace/db";
import { updateTransactionWithTypeSpecificData } from "@workspace/services/src/transaction.service";
import {
  sendAndConfirmSchema,
  sendAndConfirmResponseSchema,
} from "@workspace/transactions/src/schema-typebox";

// Elysia now uses TypeBox schemas directly from our schema-typebox file

export const solanaRouter = new Elysia({ prefix: "/solana" })

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

        return {
          success: true,
          status,
          transactionId,
          signature: signatureString,
          error,
          confirmation,
        };
      } catch (error) {
        // Handle errors during transaction processing
        const errorMsg = error instanceof Error ? error.message : String(error);
        await transactions.updateTransactionStatus(transactionId, "failed", {
          errorMessage: errorMsg,
        });

        // Make sure we're returning a signature field, even if it's empty
        // This ensures we match the response schema
        return {
          success: false,
          status: "failed",
          error: errorMsg,
          transactionId,
          signature: "", // Empty string for error case
        };
      }
    },
    {
      body: sendAndConfirmSchema,
      response: {
        200: sendAndConfirmResponseSchema,
      },
    }
  );
