import { VertigoSDK } from "@vertigo-amm/vertigo-sdk";
import * as anchor from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
function main() {
  const connection = new Connection(
    "https://api.mainnet-beta.solana.com",
    "confirmed"
  );
  const keypair = anchor.web3.Keypair.generate();
  // Load a wallet from a local file, or however you want to load a wallet
  const walletKeypair = new anchor.Wallet(keypair);

  // Initialize Anchor provider
  const provider = new anchor.AnchorProvider(
    connection,
    walletKeypair,
    anchor.AnchorProvider.defaultOptions()
  );

  // Initialize Vertigo SDK
  const vertigo = new VertigoSDK(provider);
}

main();
