export interface Token {
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
