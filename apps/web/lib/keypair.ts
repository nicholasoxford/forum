import { Keypair } from "@solana/web3.js";
import * as anchor from "@project-serum/anchor";

export function getPayerKeypair(): Keypair {
  // For development, we'll use a new keypair
  // In production, you would load this from a secure location
  return Keypair.generate();
}
