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

export interface HeliusAssetData {
  interface: string;
  id: string;
  content?: {
    metadata?: {
      name?: string;
      symbol?: string;
      description?: string;
      attributes?: Array<{
        trait_type: string;
        value: string;
      }>;
    };
    files?: Array<{
      uri: string;
      cdn_uri: string;
      mime: string;
    }>;
    links?: {
      image?: string;
    };
  };
  grouping?: Array<{
    group_key: string;
    group_value: string;
  }>;
  ownership?: {
    owner?: string;
  };
  token_info?: {
    supply?: number;
    decimals?: number;
    token_program?: string;
    mint_authority?: string;
    freeze_authority?: string;
  };
  mint_extensions?: {
    transfer_fee_config?: {
      newer_transfer_fee?: {
        transfer_fee_basis_points?: number;
      };
    };
  };
}
