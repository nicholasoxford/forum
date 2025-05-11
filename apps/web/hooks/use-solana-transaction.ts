"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { base64 } from "@metaplex-foundation/umi/serializers";
import { useUmi } from "@/hooks/use-umi";
import { server } from "@/utils/elysia";
import { TransactionType } from "@workspace/transactions";

export interface TransactionStatus {
  type: "success" | "error" | "info" | null;
  message: string;
}

export interface TransactionResult {
  status: "pending" | "confirmed" | "failed";
  signature?: string;
  transactionId: number;
  error?: string;
}

export function useSolanaTransaction<
  RequestData extends Record<string, any>,
>() {
  const umi = useUmi();
  const { publicKey, connected } = useWallet();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<TransactionStatus>({
    type: null,
    message: "",
  });
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [txResponse, setTxResponse] = useState<any>(null);
  const [currentTransactionId, setCurrentTransactionId] = useState<
    number | null
  >(null);

  const executeTransaction = useCallback(
    async (
      path: keyof typeof server.instructions,
      requestData: RequestData,
      transactionData?: any
    ) => {
      if (!publicKey) {
        setStatus({ type: "error", message: "Wallet not connected" });
        return false;
      }

      try {
        setLoading(true);
        setTxSignature(null);
        setCurrentTransactionId(null);

        setStatus({ type: "info", message: "Preparing transaction..." });

        // Get the endpoint from server.instructions
        const endpoint = server.instructions[path];
        if (!endpoint) {
          throw new Error(`Invalid endpoint path: ${path}`);
        }

        // Call the endpoint to get the serialized transaction
        const { data: endpointResponse, error: endpointError } =
          await endpoint.post(requestData as any);

        if (endpointError) {
          throw new Error(
            endpointError.value.message || "Failed to prepare transaction"
          );
        }

        // Get serialized transaction from response
        const serializedTx =
          "serializedTransaction" in endpointResponse
            ? endpointResponse.serializedTransaction
            : null;

        if (!serializedTx) {
          throw new Error("No transaction data received from server");
        }

        // Process the serialized transaction
        setStatus({
          type: "info",
          message: "Please sign the transaction in your wallet...",
        });

        // Deserialize the transaction
        const deserializedTxAsU8 = base64.serialize(serializedTx);
        const deserializedTx = umi.transactions.deserialize(deserializedTxAsU8);

        // Sign the transaction
        const signedTx = await umi.identity.signTransaction(deserializedTx);
        const serializedTxSigned = umi.transactions.serialize(signedTx);
        const serializedTxSignedAsU8 =
          base64.deserialize(serializedTxSigned)[0];

        // Send the transaction
        setStatus({
          type: "info",
          message: "Sending transaction to the blockchain...",
        });

        // Extract transaction type from the path
        // Get the last segment of the path which should correspond to the transaction type
        const pathSegments = path.split(".");
        // Validate that it's a valid TransactionType
        const txType = pathSegments[pathSegments.length - 1] as TransactionType;

        // Ensure the type is valid
        if (!isValidTransactionType(txType)) {
          throw new Error(`Invalid transaction type: ${txType}`);
        }

        // Handle special case for buy transaction type
        const finalTxData = { ...transactionData };

        // For buy transactions, ensure estimatedAmount is set when only amount is provided
        if (
          txType === "buy" &&
          finalTxData &&
          "amount" in finalTxData &&
          !("estimatedAmount" in finalTxData)
        ) {
          finalTxData.estimatedAmount = finalTxData.amount;
        }

        const { data: confirmationResponse, error: confirmationError } =
          await server.solana.sendAndConfirmWithDatabases.post({
            signature: serializedTxSignedAsU8,
            type: txType,
            userWalletAddress: publicKey.toString(),
            // Use transaction-specific data if provided
            txData: finalTxData || {},
            // Use empty object as fallback for metadata to satisfy type constraints
            metadata: (requestData as any) || {},
          });

        if (confirmationError) {
          throw new Error(
            confirmationError.value.message || "Failed to confirm transaction"
          );
        }

        // Set transaction signature and ID
        setTxSignature(confirmationResponse.signature || null);
        setTxResponse(confirmationResponse);
        setCurrentTransactionId(confirmationResponse.transactionId);

        // Set final status based on response
        if (confirmationResponse.status === "confirmed") {
          setStatus({
            type: "success",
            message: "Transaction confirmed successfully!",
          });
        } else if (confirmationResponse.status === "failed") {
          setStatus({
            type: "error",
            message: confirmationResponse.error || "Transaction failed",
          });
        } else {
          setStatus({
            type: "info",
            message: "Transaction sent, waiting for confirmation...",
          });
        }

        return confirmationResponse;
      } catch (error: any) {
        console.error("Transaction error:", error);
        setStatus({
          type: "error",
          message: error.message || "Failed to execute transaction",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, umi]
  );

  // Helper function to validate transaction types
  function isValidTransactionType(type: string): type is TransactionType {
    return [
      "buy",
      "sell",
      "create_pool",
      "claim",
      "distribute_fees",
      "create-token-2022",
    ].includes(type);
  }

  return {
    loading,
    status,
    txSignature,
    txResponse,
    transactionId: currentTransactionId,
    executeTransaction,
    connected,
  };
}
