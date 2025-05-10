export interface HeliusSignatureStatusContext {
  slot: number;
}

export interface HeliusSignatureStatus {
  slot: number;
  confirmations: number | null;
  err: Record<string, unknown> | null;
  confirmationStatus: "processed" | "confirmed" | "finalized";
}

export interface HeliusGetSignatureStatusesResponse {
  jsonrpc: string;
  id: string;
  result: {
    context: HeliusSignatureStatusContext;
    value: (HeliusSignatureStatus | null)[];
  } | null;
}

export interface SolanaEnv {
  HELIUS_API_KEY: string;
}

export const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";

// Get environment variables
export const env: SolanaEnv = {
  HELIUS_API_KEY: process.env.HELIUS_API_KEY || "",
};

export const HELIUS_RPC_URL = "https://devnet.helius-rpc.com/?api-key=";

export interface WaitForSignatureConfirmationArgs {
  signature: string;
  timeout?: number;
  interval?: number;
  heliusApiKey: string;
}

export interface SignatureStatusResponse {
  success: boolean;
  status: "confirmed" | "failed" | "timeout" | "error";
  message?: string;
  confirmation?: any;
  error?: any;
}
