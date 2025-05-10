import { Connection, PublicKey } from "@solana/web3.js";
import { buyTokens } from "@workspace/vertigo";
import { NATIVE_MINT } from "@solana/spl-token";

export async function createBuyIX({
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
  tokenMintAddress: string;
  amount: number;
  slippageBps: number;
}) {
  const poolAccountAddress = new PublicKey(poolAddress);
  const userAccountAddress = new PublicKey(userAddress);

  const buyTokensInstruction = await buyTokens(connection, {
    poolOwner: poolAccountAddress.toString(),
    mintA: NATIVE_MINT.toString(),
    mintB: tokenMintAddress,
    userAddress: userAccountAddress.toString(),
    amount,
    slippageBps,
  }).catch((error) => {
    console.error(error);
    throw error;
  });

  return buyTokensInstruction;
}
