export interface Token {
  tokenMintAddress: string;
  tokenName: string;
  tokenSymbol: string;
  decimals: number;
  transferFeeBasisPoints: number;
  metadataUri: string | null;
  creatorWalletAddress: string;
  createdAt: string;
  pool: {
    poolAddress: string;
    ownerAddress: string;
    mintA: string;
    mintB: string;
    shift: string;
    initialTokenReserves: string;
    royaltiesBps: number;
  } | null;
}
