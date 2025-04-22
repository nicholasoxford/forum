import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import {
  createNoopSigner,
  signerIdentity,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  getOrCreateAssociatedTokenAccount,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { VertigoSDK } from "@vertigo-amm/vertigo-sdk/";
import ammIdl from "@vertigo-amm/vertigo-sdk/dist/target/idl/amm.json";
import { Amm } from "@vertigo-amm/vertigo-sdk/dist/target/types/amm";
import bs58 from "bs58";
import {
  fromWeb3JsInstruction,
  fromWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";
import { base64 } from "@metaplex-foundation/umi/serializers";
// Configuration
const VERTIGO_CONFIG = {
  FEE_WALLET: process.env.VERTIGO_SECRET_KEY || "",
  PAYER_PRIVATE_KEY: process.env.VERTIGO_SECRET_KEY || "",
};

export interface PoolParams {
  shift: number; // Virtual SOL amount
  initialTokenReserves: number; // Initial token supply
  decimals: number; // Token decimals
  feeParams: {
    normalizationPeriod: number;
    decay: number;
    royaltiesBps: number;
    feeExemptBuys: number;
  };
}

export interface LaunchPoolParams {
  tokenName: string;
  tokenSymbol: string;
  tokenImage?: string;
  poolParams: PoolParams;
  ownerAddress: string;
  existingToken: {
    mintB: PublicKey;
    tokenWallet: PublicKey;
    walletAuthority: Keypair;
  };
}

export interface BuyTokensParams {
  poolOwner: string;
  mintA: string;
  mintB: string;
  userAddress: string;
  userTaA: string;
  userTaB: string;
  amount: number;
  slippageBps?: number;
}

export interface SellTokensParams {
  poolOwner: string;
  mintA: string;
  mintB: string;
  userAddress: string;
  userTaA: string;
  userTaB: string;
  amount: number;
  slippageBps?: number;
}

export interface ClaimRoyaltiesParams {
  poolAddress: string;
  mintA: string;
  receiverTaA: string;
  ownerAddress: string;
}

// Helper function to get payer keypair
export function getPayerKeypair(): Keypair {
  if (!VERTIGO_CONFIG.PAYER_PRIVATE_KEY) {
    throw new Error("PAYER_PRIVATE_KEY is not set");
  }
  const secretKey = bs58.decode(VERTIGO_CONFIG.PAYER_PRIVATE_KEY);
  return Keypair.fromSecretKey(secretKey);
}

// Helper function to create Vertigo SDK instance
function createVertigoSDK(connection: Connection): VertigoSDK {
  const payer = getPayerKeypair();
  const wallet = new anchor.Wallet(payer);
  try {
    return new VertigoSDK(connection, wallet);
  } catch (error) {
    console.error("Error creating VertigoSDK:", error);
    throw error;
  }
}

/**
 * Launch a new liquidity pool for a token
 */
export async function launchPool(
  connection: Connection,
  params: LaunchPoolParams
): Promise<{ signature: string; poolAddress: string; mintB: string }> {
  try {
    console.log("ABOUT TO CREATE VERTIGO SDK");
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

/**
 * Buy tokens from a Vertigo pool
 */
export async function buyTokens(
  connection: Connection,
  params: BuyTokensParams
): Promise<string> {
  try {
    const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
    const umi = createUmi(RPC_URL, "confirmed");

    // Note: VertigoSDK might need a signer wallet for quoteBuy,
    // using a dummy wallet here as quote doesn't require signing.
    // For the actual buy tx, the frontend user signs.
    const dummyPayer = Keypair.generate();
    const dummyWallet = new anchor.Wallet(dummyPayer);
    const vertigo = new VertigoSDK(connection, dummyWallet);

    // Convert string addresses to PublicKeys
    const owner = new PublicKey(params.poolOwner);
    const mintA = new PublicKey(params.mintA);
    const mintB = new PublicKey(params.mintB);
    const userTaA = new PublicKey(params.userTaA);
    const userTaB = new PublicKey(params.userTaB);

    const amountLamports = new BN(params.amount * LAMPORTS_PER_SOL); // Use LAMPORTS_PER_SOL
    const slippageBps = params.slippageBps || 100; // Default to 1% (100 bps)

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
    // Fetch a buy quote
    const quote = await vertigo.quoteBuy({
      params: {
        amount: new BN(5), // Amount of SOL (Mint A) to spend
        limit: new anchor.BN(0), // Limit for quote doesn't matter here
      },
      user: owner, // User making the potential buy
      owner: owner, // Pool owner
      mintA: mintB, // SOL mint
      mintB: mintA, // Token mint
    });

    console.log(`Quote received: ${quote.amountB.toString()} of token B`);
    console.log(`Fee quote: ${quote.feeA.toString()} lamports`);

    // Calculate the minimum acceptable amount B based on quote and slippage
    // slippageBps is in basis points (1% = 100 bps)
    const slippageFactor = new BN(10000).sub(new BN(slippageBps)); // e.g., 10000 - 100 = 9900 for 1% slippage
    const limitAmountB = quote.amountB.mul(slippageFactor).div(new BN(10000));

    console.log(`Calculated limit (min amount B): ${limitAmountB.toString()}`);

    // Prepare the buy instruction using the Anchor program directly
    // (as the original code did, avoids needing VertigoSDK signer for user tx)
    const provider = new anchor.AnchorProvider(
      connection,
      dummyWallet, // Use dummy wallet for provider, signing happens on frontend
      anchor.AnchorProvider.defaultOptions()
    );
    const program = new anchor.Program<Amm>(ammIdl as Amm, provider);

    const buyParams = { amount: amountLamports, limit: limitAmountB };
    console.log("Creating buy instruction with params:", buyParams);
    const buyIx = await program.methods
      .buy(buyParams)
      .accounts({
        owner,
        user: owner, // The actual user's public key
        mintA,
        mintB,
        userTaA,
        userTaB,
        tokenProgramA: TOKEN_PROGRAM_ID,
        tokenProgramB: TOKEN_2022_PROGRAM_ID,
      })
      .instruction();

    // Build and serialize transaction using UMI
    let tx = transactionBuilder();
    const signer = createNoopSigner(
      fromWeb3JsPublicKey(new PublicKey(params.userAddress))
    ); // User signs on frontend
    tx = tx.add({
      instruction: fromWeb3JsInstruction(buyIx),
      signers: [signer],
      bytesCreatedOnChain: 0,
    });

    umi.use(signerIdentity(signer)); // Umi needs identity, even if noop for building
    console.log("Building and signing transaction (client-side simulation)...");
    const buyTx = await tx
      .useV0()
      .setBlockhash(await umi.rpc.getLatestBlockhash())
      .buildAndSign(umi); // Note: 'sign' here uses the NoopSigner

    console.log("Serializing transaction...");
    const serializedBuyTx = umi.transactions.serialize(buyTx);
    const serializedBuyTxAsString = base64.deserialize(serializedBuyTx)[0];

    console.log("Returning serialized transaction.");
    return serializedBuyTxAsString;
  } catch (error: any) {
    console.error("Error buying tokens from Vertigo pool:", error);
    // Log specific details if available
    if (error.logs) {
      console.error("Transaction Logs:", error.logs);
    }
    throw new Error(`Failed to buy tokens: ${error.message}`);
  }
}

/**
 * Sell tokens to a Vertigo pool
 */
export async function sellTokens(
  connection: Connection,
  params: SellTokensParams
): Promise<string> {
  try {
    const vertigo = createVertigoSDK(connection);

    // Convert string addresses to PublicKeys
    const owner = new PublicKey(params.poolOwner);
    const mintA = new PublicKey(params.mintA);
    const mintB = new PublicKey(params.mintB);
    const userAddress = new PublicKey(params.userAddress);
    const userTaA = new PublicKey(params.userTaA);
    const userTaB = new PublicKey(params.userTaB);

    // Create user keypair (note: in a real implementation, this would come from a signature)
    const user = Keypair.generate();

    // Retrieve token decimals
    const tokenInfo = await connection.getTokenSupply(mintB);
    const decimals = tokenInfo.value.decimals;

    // Convert amount with the correct decimals
    const amount = new BN(params.amount * Math.pow(10, decimals));

    // Execute the sell transaction
    const signature = await vertigo.sell({
      owner,
      mintA,
      mintB,
      user,
      userTaA,
      userTaB,
      tokenProgramA: TOKEN_PROGRAM_ID,
      tokenProgramB: TOKEN_2022_PROGRAM_ID,
      params: {
        amount,
        limit: new BN(0),
      },
    });

    return signature;
  } catch (error: any) {
    console.error("Error selling tokens to Vertigo pool:", error);
    throw new Error(`Failed to sell tokens: ${error.message}`);
  }
}

/**
 * Claim royalty fees from a Vertigo pool
 */
export async function claimRoyalties(
  connection: Connection,
  params: ClaimRoyaltiesParams
): Promise<string> {
  try {
    const vertigo = createVertigoSDK(connection);
    const payer = getPayerKeypair();

    // Convert string addresses to PublicKeys
    const pool = new PublicKey(params.poolAddress);
    const mintA = new PublicKey(params.mintA);
    const receiverTaA = new PublicKey(params.receiverTaA);
    const claimer = Keypair.fromSecretKey(payer.secretKey);

    // Execute the claim royalties transaction
    const signature = await vertigo.claimRoyalties({
      pool,
      claimer,
      mintA,
      receiverTaA,
      tokenProgramA: TOKEN_PROGRAM_ID,
    });

    return signature;
  } catch (error: any) {
    console.error("Error claiming royalties from Vertigo pool:", error);
    throw new Error(`Failed to claim royalties: ${error.message}`);
  }
}

// Helper function to create a connection
export async function createConnection(): Promise<Connection> {
  return new Connection(
    process.env.RPC_URL || "https://api.devnet.solana.com",
    "confirmed"
  );
  // return new Connection(
  //   process.env.RPC_URL || 'https://api.mainnet-beta.solana.com'
  // )
}
