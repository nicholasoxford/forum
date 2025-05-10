import { Connection } from "@solana/web3.js";
import { sellTokens } from "@workspace/vertigo";
import { NATIVE_MINT } from "@solana/spl-token";
export async function createSellIX({
  connection,
  poolAddress,
  userAddress,
  amount,
  slippageBps,
  tokenMintAddress,
}: {
  connection: Connection;
  poolAddress: string;
  userAddress: string;
  amount: number;
  slippageBps: number;
  tokenMintAddress: string;
}) {
  const sellTokensInstruction = await sellTokens(connection, {
    poolOwner: poolAddress,
    mintA: NATIVE_MINT.toString(),
    mintB: tokenMintAddress,
    userAddress,
    amount,
    slippageBps,
  }).catch((error) => {
    console.error(error);
    throw error;
  });

  return sellTokensInstruction;
}
