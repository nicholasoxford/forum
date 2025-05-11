import { t } from "elysia";
import { NATIVE_MINT } from "@solana/spl-token";

// Common error response schemas
export const ErrorResponseSchema = t.Object({
  name: t.String(),
  message: t.String(),
  status: t.Number(),
});

// Buy instruction schemas
export const BuyInstructionBodySchema = t.Object({
  tokenMintAddress: t.String({
    error: "Token mint address must be a string",
  }),
  userAddress: t.String({ error: "User address must be a string" }),
  amount: t.Number({ error: "Amount must be a number" }),
  slippageBps: t.Optional(t.Number({ error: "Slippage must be a number" })),
});

export const BuyInstructionResponseSchema = {
  200: t.Object({
    serializedTransaction: t.String(),
  }),
  400: t.Object({
    error: t.String(),
    message: t.String(),
  }),
  404: t.Object({
    error: t.String(),
    message: t.String(),
  }),
  500: t.Object({
    error: t.String(),
    message: t.String(),
  }),
};

// Sell instruction schemas
export const SellInstructionBodySchema = t.Object({
  tokenMintAddress: t.String({
    error: "Token mint address must be a string",
  }),
  userAddress: t.String({ error: "User address must be a string" }),
  amount: t.Number({
    error: "Amount (of token to sell) must be a number",
  }),
  slippageBps: t.Optional(t.Number({ error: "Slippage must be a number" })),
});

export const SellInstructionResponseSchema = {
  200: t.Object({
    serializedTransaction: t.String(),
    poolAddress: t.String(),
  }),
  400: ErrorResponseSchema,
  404: ErrorResponseSchema,
  500: ErrorResponseSchema,
};

// Create Token 2022 schemas
export const CreateToken2022BodySchema = t.Object({
  name: t.String({ error: "Token name is required" }),
  symbol: t.String({ error: "Token symbol is required" }),
  uri: t.String({ error: "Token metadata URI is required" }),
  decimals: t.Number({ default: 6, error: "Decimals must be a number" }),
  transferFeeBasisPoints: t.Number({
    default: 100,
    error: "Transfer fee basis points must be a number",
  }),
  maximumFee: t.String({
    error: "Maximum fee must be a string representing a BigInt",
  }),
  initialMintAmount: t.Optional(
    t.String({
      error: "Initial mint amount must be a string representing a BigInt",
    })
  ),
  userAddress: t.String({ error: "User address is required" }),
});

export const CreateToken2022ResponseSchema = {
  200: t.Object({
    serializedTransaction: t.String(),
    mintAddress: t.String(),
  }),
  400: ErrorResponseSchema,
  500: ErrorResponseSchema,
};

// Launch Pool schemas
export const LaunchPoolBodySchema = t.Object({
  ownerAddress: t.String({ error: "Owner address must be a string" }),
  mintB: t.String({
    error: "Token mint address (mintB) must be a string",
  }),
  tokenWallet: t.String({
    error: "Token wallet address must be a string",
  }),
  tokenName: t.String({ error: "Token name must be a string" }),
  tokenSymbol: t.String({ error: "Token symbol must be a string" }),
  shift: t.Optional(t.Number({ error: "Shift must be a number" })),
  royaltiesBps: t.Optional(
    t.Number({
      error: "Royalties BPS must be a number",
    })
  ),
});

export const LaunchPoolResponseSchema = {
  200: t.Object({
    poolAddress: t.String(),
    signature: t.String(),
    mintB: t.String(),
  }),
  400: ErrorResponseSchema,
  500: ErrorResponseSchema,
};

// Unwrap SOL schemas
export const UnwrapSolBodySchema = t.Object({
  userAddress: t.String({ error: "User address must be a string" }),
});

export const UnwrapSolResponseSchema = {
  200: t.Object({
    serializedTransaction: t.String(),
  }),
  400: ErrorResponseSchema,
  500: ErrorResponseSchema,
};

// Claim Royalties schemas
export const ClaimRoyaltiesBodySchema = t.Object({
  poolAddress: t.String({ error: "Pool address must be a string" }),
  ownerAddress: t.String({ error: "Owner address must be a string" }),
  mintA: t.Optional(
    t.String({ default: NATIVE_MINT.toString() }) // Default mintA to wSOL
  ),
});

export const ClaimRoyaltiesResponseSchema = {
  200: t.Object({
    signature: t.String(),
    poolAddress: t.String(),
    receiverAddress: t.String(),
  }),
  400: ErrorResponseSchema,
  404: ErrorResponseSchema,
  500: ErrorResponseSchema,
};
