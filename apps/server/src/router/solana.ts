import { initializeUmi, waitForSignatureConfirmation } from "@workspace/solana";
import { Elysia, env, t } from "elysia";
import { base58, base64 } from "@metaplex-foundation/umi/serializers";
import { HELIUS_API_KEY } from "@workspace/types";

const HELIUS_RPC_URL = "https://devnet.helius-rpc.com/?api-key=";

export const solanaRouter = new Elysia({ prefix: "/solana" })
  .post(
    "/signature",
    async ({ body }) => {
      const { HELIUS_API_KEY } = env;
      const { signature, searchHistory } = body;

      if (!HELIUS_API_KEY) {
        return new Response("HELIUS_API_KEY not configured", { status: 500 });
      }

      try {
        const response = await fetch(`${HELIUS_RPC_URL}${HELIUS_API_KEY}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "1",
            method: "getSignatureStatuses",
            params: [
              [signature],
              { searchTransactionHistory: searchHistory ?? true },
            ],
          }),
        });

        const result = await response.json();
        return result;
      } catch (error) {
        console.error("Error fetching signature status:", error);
        return new Response(
          JSON.stringify({
            success: false,
            message: "Error fetching signature status",
            error: error instanceof Error ? error.message : String(error),
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    },
    {
      body: t.Object({
        signature: t.String(),
        searchHistory: t.Optional(t.Boolean()),
      }),
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

  .post(
    "/sendAndConfirmWithDatabase",
    async ({ body }) => {
      const { signature } = body;
      const umi = initializeUmi();
      const deserializedTxAsU8 = base64.serialize(signature);
      const deserializedTx = umi.transactions.deserialize(deserializedTxAsU8);
      console.log("about to send transaction");
      const response = await umi.rpc.sendTransaction(deserializedTx, {
        skipPreflight: true,
      });
      const signatureString = base58.deserialize(response)[0];
      console.log("signatureString", signatureString);
      const confirmation = await waitForSignatureConfirmation({
        signature: signatureString,
        timeout: 60000,
        interval: 200,
        heliusApiKey: HELIUS_API_KEY,
      });
      return confirmation;
    },
    {
      body: t.Object({
        signature: t.String(),
      }),
    }
  );
