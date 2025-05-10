import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";

export function initializeUmi() {
  const umi = createUmi(RPC_URL, "confirmed");

  return umi;
}
