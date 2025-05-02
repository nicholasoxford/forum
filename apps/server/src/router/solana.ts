import { Elysia, t } from "elysia";

interface SolanaEnv {
  HELIUS_API_KEY: string;
}

// Get environment variables
const env: SolanaEnv = {
  HELIUS_API_KEY: process.env.HELIUS_API_KEY || "",
};

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
        const response = await fetch(
          `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
          {
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
          }
        );

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
      const { HELIUS_API_KEY } = env;
      const { signature, timeout = 60000, interval = 2000 } = body;

      if (!HELIUS_API_KEY) {
        return {
          success: false,
          status: "error",
          message: "HELIUS_API_KEY not configured",
        };
      }

      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        try {
          const response = await fetch(
            `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                jsonrpc: "2.0",
                id: "1",
                method: "getSignatureStatuses",
                params: [[signature], { searchTransactionHistory: true }],
              }),
            }
          );

          const result = await response.json();
          const status = result.result?.value?.[0];

          // If we have a status and it's not null, transaction is confirmed
          if (status) {
            if (status.err) {
              return {
                success: false,
                status: "failed",
                error: status.err,
                confirmation: status,
              };
            } else {
              return {
                success: true,
                status: "confirmed",
                confirmation: status,
              };
            }
          }

          // Wait before checking again
          await new Promise((resolve) => setTimeout(resolve, interval));
        } catch (error) {
          console.error("Error checking signature status:", error);
          // Continue checking despite error
        }
      }

      // Timeout reached
      return {
        success: false,
        status: "timeout",
        message: `Transaction not confirmed after ${timeout}ms`,
      };
    },
    {
      body: t.Object({
        signature: t.String(),
        timeout: t.Optional(t.Number()),
        interval: t.Optional(t.Number()),
      }),
    }
  );
