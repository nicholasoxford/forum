import { useWallet } from "@jup-ag/wallet-adapter";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";

export function useUmi() {
  const wallet = useWallet();

  const umi = createUmi(RPC_URL, "confirmed");
  umi.use(walletAdapterIdentity(wallet));

  return umi;
}
