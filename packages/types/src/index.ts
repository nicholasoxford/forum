export * from "./vertigo";
export * from "./token";
export * from "./helius-types";

export interface GetAllTokensResult {
  tokenMintAddress: string;
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
  transferFeeBasisPoints: number;
  metadataUri: string;
  creatorWalletAddress: string;
  pool: {
    poolAddress: string;
    ownerAddress: string;
    mintA: string;
    mintB: string;
    shift: number;
    initialTokenReserves: number;
    royaltiesBps: number;
  } | null;
}

export interface GetTokenPoolResult {
  tokenMintAddress: string;
  tokenSymbol: string;
  tokenName: string;
  decimals: number;
  transferFeeBasisPoints: number;
  maximumFee: string;
  metadataUri: string;
  targetMarketCap: string;
  poolAddress: string;
}

export interface TokenBalance {
  amount: string;
  decimals: number;
  uiAmount: number | null; // Can be null if account doesn't exist or has 0 balance sometimes
  uiAmountString: string;
}

export interface GetTokenBalanceResult {
  wallet: string;
  mint: string;
  balance: TokenBalance;
  tokenAccount: string;
  exists: boolean;
}

// Helius specific types - keep them separate for clarity
// ... existing code ...
