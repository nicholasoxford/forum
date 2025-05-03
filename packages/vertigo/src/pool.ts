import { BN } from "@coral-xyz/anchor";
import {
  getOrCreateAssociatedTokenAccount,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getPayerKeypair } from "@workspace/solana";
import { createVertigoSDK } from "./utils";
import { LaunchPoolParams } from "@workspace/types";
/**
 * Launch a new liquidity pool for a token
 */
export async function launchPool(
  connection: Connection,
  params: LaunchPoolParams
): Promise<{ signature: string; poolAddress: string; mintB: string }> {
  try {
    const vertigo = createVertigoSDK(connection);
    const payer = getPayerKeypair();

    // Check if we're using an existing token
    const mintB = params.existingToken?.mintB;
    if (!mintB) {
      throw new Error("MintB and tokenWallet must be provided");
    }
    console.log("ABOUT TO GET OR CREATE ASSOCIATED TOKEN ACCOUNT");
    const tokenWallet = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mintB,
      payer.publicKey,
      false,
      "confirmed",
      { commitment: "confirmed" },
      TOKEN_2022_PROGRAM_ID
    );
    console.log("TOKEN ACCOUNT", tokenWallet.address.toString());
    // Use provided wallet authority or generate a new one
    const tokenWalletAuthority = params.existingToken.walletAuthority;
    // Get token decimals from the blockchain if using an existing token
    const decimals = 6;

    // Prepare pool parameters in the format Vertigo SDK expects
    const poolParams = {
      shift: new BN(LAMPORTS_PER_SOL).muln(params.poolParams.shift),
      initialTokenBReserves: new BN(
        params.poolParams.initialTokenReserves * 10 ** decimals
      ),
      feeParams: {
        normalizationPeriod: new BN(
          params.poolParams.feeParams.normalizationPeriod
        ),
        decay: params.poolParams.feeParams.decay,
        royaltiesBps: params.poolParams.feeParams.royaltiesBps,
        feeExemptBuys: params.poolParams.feeParams.feeExemptBuys,
        reference: new BN(0),
      },
    };

    // Launch the pool
    const { deploySignature, poolAddress } = await vertigo.launchPool({
      // Pool configuration
      params: {
        shift: poolParams.shift,
        initialTokenBReserves: poolParams.initialTokenBReserves,
        feeParams: {
          normalizationPeriod: poolParams.feeParams.normalizationPeriod,
          decay: poolParams.feeParams.decay,
          royaltiesBps: poolParams.feeParams.royaltiesBps,
          privilegedSwapper: null,
          reference: new BN(0),
        },
      },

      // Authority configuration
      payer: payer,
      owner: payer,
      tokenWalletAuthority,

      // Token configuration
      tokenWalletB: tokenWallet.address,
      mintA: NATIVE_MINT,
      mintB,
      tokenProgramA: TOKEN_PROGRAM_ID,
      tokenProgramB: TOKEN_2022_PROGRAM_ID,
    });

    return {
      signature: deploySignature,
      poolAddress: poolAddress.toString(),
      mintB: mintB.toString(),
    };
  } catch (error: any) {
    console.error("Error launching Vertigo pool:", error);
    throw new Error(`Failed to launch pool: ${error.message}`);
  }
}
