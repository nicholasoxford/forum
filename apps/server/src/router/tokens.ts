import { Elysia, t } from "elysia";

import {
  launchToken,
  getAllTokens,
  getTokenPool,
  getTokenById,
  getTokenBalance,
} from "@workspace/services";

import {
  LaunchTokenBodySchema,
  GetAllTokensResponseSchema,
  GetTokenPoolParamsSchema,
  GetTokenPoolResponseSchema,
  GetTokenByIdParamsSchema,
  GetTokenByIdResponseSchema,
  GetTokenBalanceQuerySchema,
  GetTokenBalanceResponseSchema,
} from "@workspace/schemas";

export const tokensRouter = new Elysia({
  prefix: "/tokens",
  detail: {
    tags: ["Tokens"],
  },
})
  .get(
    "/",
    async ({ set }) => {
      try {
        const allTokens = await getAllTokens();
        return allTokens;
      } catch (error: any) {
        console.error("[tokens GET]", error);
        set.status = 500;
        throw new Error(error?.message || "Failed to fetch tokens");
      }
    },
    {
      response: GetAllTokensResponseSchema,
    }
  )

  .get(
    "/:id",
    async ({ params, set }) => {
      try {
        const { id } = params;

        if (!id) {
          set.status = 400;
          return { error: "Token ID is required" };
        }

        const tokenData = await getTokenById(id);
        return tokenData;
      } catch (err: any) {
        console.error("[tokens/:id GET handler] Error:", err);
        // Use status from service error if available, otherwise default
        const status = err.status || 500;
        set.status = status;

        // Construct a meaningful error response
        let errorMessage = "Internal Server Error";
        let errorDetails = err?.message; // Default to err.message

        if (status === 404) {
          errorMessage = "Token not found";
          errorDetails = err.details || err.message; // Prefer err.details if Helius provided it
        } else if (status === 502) {
          errorMessage = "Bad Gateway / Upstream API error";
          errorDetails = err.details || err.message; // Prefer err.details
        } else if (
          err.message &&
          err.message.startsWith("Server configuration error")
        ) {
          errorMessage = "Server configuration error";
        }

        return { error: errorMessage, message: errorDetails };
      }
    },
    {
      params: GetTokenByIdParamsSchema,
      response: GetTokenByIdResponseSchema,
    }
  )
  .get(
    "/:id/pool",
    async ({ params, set }) => {
      try {
        const { id } = params;

        if (!id) {
          set.status = 400;
          return {
            error: "Token ID is required",
            message: "Please provide a token ID.",
          };
        }

        const tokenPoolInfo = await getTokenPool(id);
        return tokenPoolInfo;
      } catch (error: any) {
        console.error("[tokens/:id/pool GET]", error);
        if (error.message && error.message.includes("Token not found")) {
          set.status = 404;
          return {
            error: "Token not found",
            message: error.message,
          };
        }
        set.status = 500;
        return {
          error: "Internal server error",
          message: error?.message || "Failed to fetch token pool",
        };
      }
    },
    {
      params: GetTokenPoolParamsSchema,
      response: GetTokenPoolResponseSchema,
    }
  )
  .get(
    "/balance",
    async ({ query, set }) => {
      try {
        const { wallet, mint } = query;

        if (!wallet || !mint) {
          set.status = 400;
          return {
            error: "Missing required parameters: wallet and mint",
          };
        }

        const balanceInfo = await getTokenBalance(wallet, mint);
        return balanceInfo;
      } catch (error: any) {
        console.error("[token balance GET handler]", error);
        if (error.status === 400) {
          set.status = 400;
          return { error: error.message };
        }
        set.status = 500;
        return {
          error: "Failed to get token balance",
          message: error?.message,
        };
      }
    },
    {
      query: GetTokenBalanceQuerySchema,
      response: GetTokenBalanceResponseSchema,
    }
  )
  .post(
    "/launch-token",
    async ({ body, set }) => {
      try {
        const result = await launchToken(body);
        return result;
      } catch (error: any) {
        console.error("[tokens POST /launch-token]", error);
        set.status = 500;
        return { error: "Internal Server Error", message: error?.message };
      }
    },
    {
      body: LaunchTokenBodySchema,
    }
  );
