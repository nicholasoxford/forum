import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import {
  createNoopSigner,
  signerIdentity,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getOrCreateAssociatedTokenAccount,
  NATIVE_MINT,
  createSyncNativeInstruction,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import ammIdl from "@vertigo-amm/vertigo-sdk/dist/target/idl/amm.json";
import { Amm } from "@vertigo-amm/vertigo-sdk/dist/target/types/amm";
import {
  fromWeb3JsInstruction,
  fromWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";
import { base64 } from "@metaplex-foundation/umi/serializers";
import { BuyTokensParams } from "@/types/vertigo";
import { getPayerKeypair } from ".";

/**
 * Wraps SOL to wSOL by transferring SOL and syncing the native account
 */
async function wrapSol(
  connection: Connection,
  amountLamports: number,
  userPublicKey: PublicKey,
  payer: Keypair
): Promise<TransactionInstruction[]> {
  try {
    // Get the associated token account for wSOL
    const userWsolAta = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      NATIVE_MINT,
      userPublicKey,
      false,
      "confirmed",
      { commitment: "confirmed" },
      TOKEN_PROGRAM_ID
    );

    // Create a transaction to transfer SOL and sync the native account
    const instructions = [
      // Transfer SOL to the associated token account
      SystemProgram.transfer({
        fromPubkey: userPublicKey,
        toPubkey: userWsolAta.address,
        lamports: amountLamports,
      }),
      // Sync native instruction to convert SOL to wSOL
      createSyncNativeInstruction(userWsolAta.address),
    ];

    // Serialize the transaction
    return instructions;
  } catch (error: any) {
    console.error("Error wrapping SOL:", error);
    throw new Error(
      `Failed to prepare SOL wrapping transaction: ${error.message}`
    );
  }
}

/**
 * Buy tokens from a Vertigo pool
 * Handles ATA creation using backend payer.
 */
export async function buyTokens(
  connection: Connection,
  params: Omit<BuyTokensParams, "userTaA" | "userTaB"> & { userAddress: string }
): Promise<string> {
  try {
    const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
    const umi = createUmi(RPC_URL, "confirmed");

    const dummyPayer = Keypair.generate();
    const dummyWallet = new anchor.Wallet(dummyPayer);

    // Convert string addresses to PublicKeys
    const owner = new PublicKey(params.poolOwner);
    const mintA = new PublicKey(params.mintA);
    const mintB = new PublicKey(params.mintB);
    const userPublicKey = new PublicKey(params.userAddress);

    // --- Get backend payer and create/find ATAs ---
    const backendPayer = getPayerKeypair();
    console.log(
      `[buyTokens] Using backend payer: ${backendPayer.publicKey.toString()}`
    );

    console.log(
      `[buyTokens] Getting/creating ATA for Mint A (${mintA.toString()}) owned by ${userPublicKey.toString()}`
    );
    const userTaAResponse = await getOrCreateAssociatedTokenAccount(
      connection,
      backendPayer,
      mintA,
      userPublicKey,
      false,
      "confirmed",
      { commitment: "confirmed" },
      mintA.equals(NATIVE_MINT) ? TOKEN_PROGRAM_ID : TOKEN_PROGRAM_ID
    );
    const userTaA = userTaAResponse.address;
    console.log(
      `[buyTokens] Using ATA A (${userTaA.toString()}) for owner ${userPublicKey.toString()}`
    );

    console.log(
      `[buyTokens] Getting/creating ATA for Mint B (${mintB.toString()}) owned by ${userPublicKey.toString()}`
    );
    const userTaBResponse = await getOrCreateAssociatedTokenAccount(
      connection,
      backendPayer,
      mintB,
      userPublicKey,
      false,
      "confirmed",
      { commitment: "confirmed" },
      TOKEN_2022_PROGRAM_ID
    );
    const userTaB = userTaBResponse.address;
    console.log(
      `[buyTokens] Using ATA B (${userTaB.toString()}) for owner ${userPublicKey.toString()}`
    );
    // --- End ATA logic ---

    const amountLamports = new BN(params.amount * LAMPORTS_PER_SOL);

    // --- Special wSOL quality of life handling ---
    let wrapTx: TransactionInstruction[] | undefined;
    if (mintA.equals(NATIVE_MINT)) {
      console.log(
        "[buyTokens] Detected SOL as input token, checking wSOL balance"
      );

      // Check wSOL balance
      let wSolBalance = 0;
      try {
        const balance = await connection.getTokenAccountBalance(userTaA);
        wSolBalance = new BN(balance.value.amount).toNumber();
        console.log(
          `[buyTokens] User wSOL balance: ${wSolBalance / LAMPORTS_PER_SOL} SOL`
        );
      } catch (error) {
        console.log(
          "[buyTokens] Error getting wSOL balance, likely account doesn't exist yet"
        );
      }

      // Check native SOL balance
      const solBalance = await connection.getBalance(userPublicKey);
      console.log(
        `[buyTokens] User SOL balance: ${solBalance / LAMPORTS_PER_SOL} SOL`
      );

      // Check if we need to wrap SOL
      const amountInLamports = params.amount * LAMPORTS_PER_SOL;
      if (amountInLamports > wSolBalance) {
        console.log(
          `[buyTokens] Need more wSOL: has ${wSolBalance}, needs ${amountInLamports}`
        );

        // Check if user has enough total SOL (wSOL + SOL)
        if (solBalance + wSolBalance < amountInLamports) {
          throw new Error(
            `Not enough SOL. Balance: ${(solBalance + wSolBalance) / LAMPORTS_PER_SOL} SOL, required: ${params.amount} SOL`
          );
        }

        // Calculate how much SOL to wrap
        const diffLamports = amountInLamports - wSolBalance;
        if (diffLamports > 0) {
          console.log(
            `[buyTokens] Preparing transaction to wrap ${diffLamports / LAMPORTS_PER_SOL} SOL to wSOL`
          );
          wrapTx = await wrapSol(
            connection,
            diffLamports,
            userPublicKey,
            backendPayer
          );
        }
      }

      // Validate wSOL account has or will have sufficient balance
      if (!wrapTx && wSolBalance < amountInLamports) {
        throw new Error(
          `Insufficient wSOL balance for operation. Has: ${wSolBalance / LAMPORTS_PER_SOL} SOL, needs: ${params.amount} SOL`
        );
      }
    } else {
      // For non-SOL tokens, check if user has enough balance in token A
      try {
        const balance = await connection.getTokenAccountBalance(userTaA);
        const tokenBalance = new BN(balance.value.amount).toNumber();
        console.log(`[buyTokens] User token A balance: ${tokenBalance}`);

        if (tokenBalance < amountLamports.toNumber()) {
          throw new Error(
            `Insufficient token balance. Has: ${tokenBalance}, needs: ${amountLamports.toNumber()}`
          );
        }
      } catch (error: any) {
        throw new Error(
          `Failed to get token balance or token account doesn't exist: ${error.message}`
        );
      }
    }
    // --- End wSOL handling ---

    console.log(
      `Fetching quote for buying with ${params.amount} SOL (${amountLamports.toString()} lamports)`
    );
    console.log({
      mintA: mintA.toString(),
      mintB: mintB.toString(),
      user: owner.toString(),
      owner: owner.toString(),
      amount: amountLamports.toString(),
    });

    const provider = new anchor.AnchorProvider(
      connection,
      dummyWallet,
      anchor.AnchorProvider.defaultOptions()
    );
    const program = new anchor.Program<Amm>(ammIdl as Amm, provider);

    const buyParams = { amount: amountLamports, limit: new BN(0) };
    console.log("Creating buy instruction with params:", buyParams);
    console.log("Accounts for buy:", {
      owner: owner.toString(),
      user: userPublicKey.toString(),
      mintA: mintA.toString(),
      mintB: mintB.toString(),
      userTaA: userTaA.toString(),
      userTaB: userTaB.toString(),
      tokenProgramA: mintA.equals(NATIVE_MINT)
        ? TOKEN_PROGRAM_ID.toString()
        : TOKEN_PROGRAM_ID.toString(),
      tokenProgramB: TOKEN_2022_PROGRAM_ID.toString(),
    });

    const buyIx = await program.methods
      .buy(buyParams)
      .accounts({
        owner,
        user: userPublicKey,
        mintA,
        mintB,
        userTaA,
        userTaB,
        tokenProgramA: mintA.equals(NATIVE_MINT)
          ? TOKEN_PROGRAM_ID
          : TOKEN_PROGRAM_ID,
        tokenProgramB: TOKEN_2022_PROGRAM_ID,
      })
      .instruction();

    let tx = transactionBuilder();
    const signer = createNoopSigner(fromWeb3JsPublicKey(userPublicKey));

    if (wrapTx && wrapTx[0]) {
      tx = tx.add({
        instruction: fromWeb3JsInstruction(wrapTx[0]),
        signers: [signer],
        bytesCreatedOnChain: 0,
      });
    }
    if (wrapTx && wrapTx[1]) {
      tx = tx.add({
        instruction: fromWeb3JsInstruction(wrapTx[1]),
        signers: [signer],
        bytesCreatedOnChain: 0,
      });
    }
    tx = tx.add({
      instruction: fromWeb3JsInstruction(buyIx),
      signers: [signer],
      bytesCreatedOnChain: 0,
    });

    umi.use(signerIdentity(signer));
    const buyTx = await tx
      .useV0()
      .setBlockhash(await umi.rpc.getLatestBlockhash())
      .buildAndSign(umi);

    console.log("Serializing transaction...");
    const serializedBuyTx = umi.transactions.serialize(buyTx);
    const serializedBuyTxAsString = base64.deserialize(serializedBuyTx)[0];

    console.log("Returning serialized transaction.");
    return serializedBuyTxAsString;
  } catch (error: any) {
    console.error("Error buying tokens from Vertigo pool:", error);
    if (error.logs) {
      console.error("Transaction Logs:", error.logs);
    }
    if (error instanceof Error) {
      console.error("Error Name:", error.name);
      console.error("Error Message:", error.message);
      console.error("Error Stack:", error.stack);
    }
    throw new Error(`Failed to prepare buy transaction: ${error.message}`);
  }
}
