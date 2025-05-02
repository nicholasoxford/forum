import {
  Umi,
  generateSigner,
  Signer,
  TransactionBuilder,
} from "@metaplex-foundation/umi";
import {
  createInitializeMetadataPointerInstruction,
  createInitializeMintCloseAuthorityInstruction,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  createMintToInstruction,
  ExtensionType,
  getAssociatedTokenAddress,
  getMintLen,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
} from "@solana/spl-token";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  createAccount,
  createAssociatedToken,
  mplToolbox,
} from "@metaplex-foundation/mpl-toolbox";
import {
  fromWeb3JsInstruction,
  fromWeb3JsPublicKey,
  toWeb3JsPublicKey,
} from "@metaplex-foundation/umi-web3js-adapters";
import { base58 } from "@metaplex-foundation/umi/serializers";
import {
  createInitializeInstruction,
  pack,
  TokenMetadata,
} from "@solana/spl-token-metadata";
import { server } from "@/utils/elysia";

// Token configuration interface
export interface SplTokenConfig {
  name: string;
  symbol: string;
  uri: string;
  decimals: number;
  transferFeeBasisPoints: number;
  maximumFee: bigint;
  initialMintAmount?: bigint; // Add optional initial mint amount
  transferFeeConfigAuthority?: Signer;
  withdrawWithheldAuthority?: Signer;
}

/**
 * Waits for a transaction to be confirmed
 */
async function waitForTransaction(
  signature: string,
  timeoutMs = 60000,
  intervalMs = 2000
): Promise<{
  success: boolean;
  status: string;
  error?: any;
  confirmation?: any;
}> {
  try {
    const response = await server.solana["wait-for-signature"].post({
      signature,
      timeout: timeoutMs,
      interval: intervalMs,
    });
    if (response.error || !response.data.success) {
      throw new Error("Transaction not confirmed");
    }

    return {
      success: true,
      status: "confirmed",
      confirmation: response.data.confirmation,
    };
  } catch (error) {
    console.error("Error waiting for transaction confirmation:", error);
    return {
      success: false,
      status: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Creates a Token 2022 mint with transfer fee extension, metadata, and optional initial mint.
 * Returns the mint signer.
 */
export async function createSplToken(
  umi: Umi,
  config: SplTokenConfig
): Promise<{
  mint: Signer;
  signature: string;
  success: boolean;
}> {
  if (!umi.identity.publicKey) {
    throw new Error("Wallet not connected");
  }
  umi.use(mplToolbox());
  umi.use(mplTokenMetadata());

  const mint = generateSigner(umi);

  const mintAuthority = umi.identity;
  const transferFeeConfigAuthority =
    config.transferFeeConfigAuthority ?? umi.identity;
  const withdrawWithheldAuthority =
    config.withdrawWithheldAuthority ?? umi.identity;

  const extensions = [
    ExtensionType.TransferFeeConfig,
    ExtensionType.MetadataPointer,
    ExtensionType.MintCloseAuthority,
  ];

  // Define the metadata structure using config values
  const tokenMetadata: TokenMetadata = {
    mint: toWeb3JsPublicKey(mint.publicKey),
    name: config.name,
    symbol: config.symbol,
    uri: config.uri,
    additionalMetadata: [],
  };

  const mintLen = getMintLen(extensions);
  const metadataLen = pack(tokenMetadata).length;
  const totalSize = mintLen + TYPE_SIZE + LENGTH_SIZE + metadataLen;
  const rent = await umi.rpc.getRent(totalSize);

  // Create transaction builder
  let tx = new TransactionBuilder();

  // 1. Create Account Instruction
  tx = tx.add(
    createAccount(umi, {
      newAccount: mint,
      payer: umi.payer,
      lamports: rent,
      space: mintLen, // Only allocate space for extensions initially
      programId: fromWeb3JsPublicKey(TOKEN_2022_PROGRAM_ID),
    })
  );

  // 2. Initialize TransferFeeConfig Instruction
  const initializeTransferFeeConfig =
    createInitializeTransferFeeConfigInstruction(
      toWeb3JsPublicKey(mint.publicKey),
      toWeb3JsPublicKey(transferFeeConfigAuthority.publicKey),
      toWeb3JsPublicKey(withdrawWithheldAuthority.publicKey),
      config.transferFeeBasisPoints,
      config.maximumFee,
      TOKEN_2022_PROGRAM_ID
    );

  tx = tx.add({
    instruction: fromWeb3JsInstruction(initializeTransferFeeConfig),
    signers: [umi.identity], // TransferFee authority needs to sign if different from payer
    bytesCreatedOnChain: 0,
  });

  // 3. Initialize MetadataPointer Instruction
  const metadataPointerInstruction = createInitializeMetadataPointerInstruction(
    toWeb3JsPublicKey(mint.publicKey),
    toWeb3JsPublicKey(umi.payer.publicKey), // Payer is the update authority for the pointer
    toWeb3JsPublicKey(mint.publicKey), // Metadata address is the mint itself
    TOKEN_2022_PROGRAM_ID
  );

  tx = tx.add({
    instruction: fromWeb3JsInstruction(metadataPointerInstruction),
    signers: [umi.identity], // Payer needs to sign
    bytesCreatedOnChain: 0,
  });

  const closeMintIx = createInitializeMintCloseAuthorityInstruction(
    toWeb3JsPublicKey(mint.publicKey),
    toWeb3JsPublicKey(umi.identity.publicKey),
    TOKEN_2022_PROGRAM_ID
  );

  tx = tx.add({
    instruction: fromWeb3JsInstruction(closeMintIx),
    signers: [umi.identity],
    bytesCreatedOnChain: 0,
  });

  // 4. Initialize Mint Instruction
  const initializeMint = createInitializeMintInstruction(
    toWeb3JsPublicKey(mint.publicKey),
    config.decimals,
    toWeb3JsPublicKey(mintAuthority.publicKey),
    toWeb3JsPublicKey(mintAuthority.publicKey), // Freeze authority
    TOKEN_2022_PROGRAM_ID
  );

  tx = tx.add({
    instruction: fromWeb3JsInstruction(initializeMint),
    signers: [umi.identity], // Mint authority needs to sign if different from payer
    bytesCreatedOnChain: 0,
  });

  // 5. Initialize Metadata Instruction (writes metadata to the mint account)
  const initializeMetadata = createInitializeInstruction({
    programId: TOKEN_2022_PROGRAM_ID,
    mint: toWeb3JsPublicKey(mint.publicKey),
    metadata: toWeb3JsPublicKey(mint.publicKey), // Metadata stored in mint account
    name: tokenMetadata.name,
    symbol: tokenMetadata.symbol,
    uri: tokenMetadata.uri,
    mintAuthority: toWeb3JsPublicKey(mintAuthority.publicKey),
    updateAuthority: toWeb3JsPublicKey(umi.payer.publicKey), // Payer is the metadata update authority
  });

  tx = tx.add({
    instruction: fromWeb3JsInstruction(initializeMetadata),
    signers: [umi.identity, mint],
    bytesCreatedOnChain: metadataLen, // Specify bytes for metadata packed into mint account
  });

  // Create and add ATA instruction

  const destinationAccount = await getAssociatedTokenAddress(
    toWeb3JsPublicKey(mint.publicKey),
    toWeb3JsPublicKey(umi.identity.publicKey),
    false,
    TOKEN_2022_PROGRAM_ID
  );
  console.log("Destination Account: ", destinationAccount.toString());
  tx = tx.add(
    createAssociatedToken(umi, {
      mint: mint.publicKey,
      owner: umi.identity.publicKey,
      tokenProgram: fromWeb3JsPublicKey(TOKEN_2022_PROGRAM_ID),
    })
  );
  const mintV1Instruction = createMintToInstruction(
    toWeb3JsPublicKey(mint.publicKey),
    destinationAccount,
    toWeb3JsPublicKey(mintAuthority.publicKey),
    config.initialMintAmount ?? 0n,
    [],
    TOKEN_2022_PROGRAM_ID
  );

  tx = tx.add({
    instruction: fromWeb3JsInstruction(mintV1Instruction),
    signers: [umi.identity, mint],
    bytesCreatedOnChain: 0,
  });

  // --- Build, Sign, and Send Transaction ---
  tx = await tx.setLatestBlockhash(umi);
  tx = tx.setFeePayer(umi.identity);
  const builtTx = await tx.buildAndSign(umi);

  // Sign with the mint keypair
  const signedTransaction = await mint.signTransaction(builtTx);

  const result = await umi.rpc.sendTransaction(signedTransaction, {
    skipPreflight: true, // Recommended for Token 2022 extension ixns
  });

  const signature = base58.deserialize(result)[0];
  console.log(`Transaction Signature: ${signature}`);
  console.log(
    `Mint Address: ${mint.publicKey.toString()} (Explorer: https://explorer.solana.com/address/${mint.publicKey.toString()}?cluster=devnet)`
  );
  console.log(
    `Transaction Link: https://explorer.solana.com/tx/${signature}?cluster=devnet`
  );

  // Wait for the transaction to be confirmed
  console.log("Waiting for transaction confirmation...");
  const confirmationResult = await waitForTransaction(signature);

  if (confirmationResult.success) {
    console.log("Transaction confirmed successfully!");
  } else {
    console.error(
      "Transaction failed or timed out:",
      confirmationResult.status,
      confirmationResult.error
    );
  }

  return {
    mint: mint,
    signature,
    success: confirmationResult.success,
  };
}
