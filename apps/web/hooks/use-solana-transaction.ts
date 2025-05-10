"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { base64 } from "@metaplex-foundation/umi/serializers";
import { useUmi } from "@/hooks/use-umi";
import { server } from "@/utils/elysia";

export interface TransactionStatus {
  type: "success" | "error" | "info" | null;
  message: string;
}

export function useSolanaTransaction<RequestData, ResponseData>() {
  const umi = useUmi();
  const { publicKey, connected } = useWallet();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<TransactionStatus>({
    type: null,
    message: "",
  });
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [txResponse, setTxResponse] = useState<any>(null);

  const executeTransaction = useCallback(
    async (path: string, requestData: RequestData) => {
      if (!publicKey) {
        setStatus({ type: "error", message: "Wallet not connected" });
        return false;
      }

      try {
        setLoading(true);
        setTxSignature(null);
        setStatus({ type: "info", message: "Preparing transaction..." });

        // Parse the path to call the correct endpoint
        const pathParts = path.split(".");
        let endpoint: any = server;

        // Navigate through the path to get to the endpoint
        for (const part of pathParts) {
          endpoint = endpoint[part];
          if (!endpoint) {
            throw new Error(`Invalid endpoint path: ${path}`);
          }
        }

        // Call the endpoint to get the serialized transaction
        const { data: endpointResponse, error: endpointError } =
          await endpoint.post(requestData);

        if (endpointError) {
          throw new Error(
            endpointError.value.message || "Failed to prepare transaction"
          );
        }

        // Get serialized transaction from response
        const serializedTx = endpointResponse.serializedTransaction;

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

        const { data: confirmationResponse, error: confirmationError } =
          await server.solana.sendAndConfirmWithDatabase.post({
            signature: serializedTxSignedAsU8,
          });

        if (confirmationError) {
          throw new Error(
            confirmationError.value.message || "Failed to confirm transaction"
          );
        }

        setStatus({
          type: "success",
          message: "Transaction confirmed successfully!",
        });
        setTxSignature(confirmationResponse.confirmation);
        setTxResponse(confirmationResponse);

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

  return {
    loading,
    status,
    txSignature,
    txResponse,
    executeTransaction,
    connected,
  };
}
