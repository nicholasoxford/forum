import {
  Umi,
  generateSigner,
  Signer,
  TransactionBuilder,
  createNoopSigner,
  publicKey,
  signerIdentity,
  signTransaction,
  KeypairSigner,
  createSignerFromKeypair,
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
  fromWeb3JsKeypair,
} from "@metaplex-foundation/umi-web3js-adapters";
import {
  createInitializeInstruction,
  pack,
  TokenMetadata,
} from "@solana/spl-token-metadata";
import {
  getAvailableKeypair,
  markKeypairAsUsed,
  reconstructKeypair,
} from "./keypair.service";
import { Keypair } from "@solana/web3.js";

// Token configuration interface
export interface SplTokenConfig {
  name: string;
  symbol: string;
  uri: string;
  decimals: number;
  transferFeeBasisPoints: number;
  maximumFee: bigint;
  initialMintAmount?: bigint; // Optional initial mint amount
  transferFeeConfigAuthority?: Signer;
  withdrawWithheldAuthority?: Signer;
  useFunKeypair?: boolean; // Whether to use a "fun" keypair from the database
  funKeypairSuffix?: string; // The suffix to look for (default is "fun")
}

export interface CreateSplTokenResult {
  mint: Signer;
  serializedTransaction: string;
  usedKeypairPublicKey?: string; // If a fun keypair was used, return its public key
}

/**
 * Creates and returns a serialized transaction for creating a Token 2022 mint with transfer fee extension
 * and metadata. Does not submit the transaction.
 */
export async function createSplTokenTransaction(
  umi: Umi,
  config: SplTokenConfig,
  walletAddress: string
): Promise<CreateSplTokenResult> {
  const mySigner = createNoopSigner(publicKey(walletAddress));
  umi.use(signerIdentity(mySigner));
  console.log("Using mplToolbox and mplTokenMetadata");
  umi.use(mplToolbox());
  umi.use(mplTokenMetadata());
  console.log("Using mplToolbox and mplTokenMetadata");

  let mint: Signer;
  let usedKeypairPublicKey: string | undefined;

  // Check if we should use a fun keypair from the database
  if (config.useFunKeypair) {
    const suffix = config.funKeypairSuffix || "fun";
    const keypairFromDb = await getAvailableKeypair(suffix);

    if (!keypairFromDb) {
      throw new Error(
        `No available keypair with suffix '${suffix}' found in the database`
      );
    }

    // Convert the database keypair to a Solana Keypair
    const solanaKeypair = reconstructKeypair(keypairFromDb);

    // Convert the Solana Keypair to an Umi KeypairSigner
    mint = createSignerFromKeypair(umi, fromWeb3JsKeypair(solanaKeypair));
    usedKeypairPublicKey = keypairFromDb.publicKey;

    console.log(
      `Using fun keypair with public key: ${mint.publicKey.toString()}`
    );
  } else {
    // Generate a random keypair for the mint
    mint = generateSigner(umi);
  }

  console.log("Mint: ", mint.publicKey.toString());
  const mintAuthority = umi.identity;
  console.log("Mint Authority: ", mintAuthority.publicKey.toString());
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
  console.log("Rent: ", rent);
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
  console.log("Created account instruction");

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

  // --- Build and set required parameters ---
  tx = await tx.setLatestBlockhash(umi);
  tx = tx.setFeePayer(umi.identity);

  // Build the transaction but don't sign it yet
  let builtTx = tx.build(umi);

  builtTx = await signTransaction(builtTx, [mint]);

  // Serialize the transaction to base64 for transmission
  const serializedBytes = umi.transactions.serialize(builtTx);
  const serializedBase64 = Buffer.from(serializedBytes).toString("base64");

  // If we used a fun keypair, mark it as used
  if (usedKeypairPublicKey) {
    await markKeypairAsUsed(usedKeypairPublicKey, mint.publicKey.toString());
  }

  // Return the mint signer and serialized transaction
  return {
    mint: mint,
    serializedTransaction: serializedBase64,
    usedKeypairPublicKey,
  };
}

/**
 * Utility function to wait for a transaction signature to be confirmed
 */
export async function waitForSignatureConfirmation(
  signature: string,
  timeout: number = 60000,
  interval: number = 2000
): Promise<boolean> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    try {
      // This would need to be implemented with an RPC call to check signature status
      // For now, just a placeholder to be implemented based on project requirements
      return true;
    } catch (error) {
      console.log("Waiting for transaction confirmation...");
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
  }

  throw new Error(
    `Transaction confirmation timeout for signature: ${signature}`
  );
}
