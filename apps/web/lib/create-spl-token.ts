import {
  Umi,
  generateSigner,
  PublicKey as UmiPublicKey,
  publicKey,
  Signer,
  amountToNumber,
  TransactionBuilder,
} from "@metaplex-foundation/umi";
import {
  createCloseAccountInstruction,
  createInitializeMetadataPointerInstruction,
  createInitializeMintCloseAuthorityInstruction,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  createMintToInstruction,
  ExtensionType,
  getAssociatedTokenAddress,
  getMintLen,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID as SPL_TOKEN_2022_PROGRAM_ID_SOLANA,
  TYPE_SIZE,
} from "@solana/spl-token";
import { PublicKey, PublicKey as SolanaPublicKey } from "@solana/web3.js";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import {
  createAccount,
  createAssociatedToken,
  mplToolbox,
} from "@metaplex-foundation/mpl-toolbox";
import { fromWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters";
import { base58 } from "@metaplex-foundation/umi/serializers";
import {
  createInitializeInstruction,
  pack,
  TokenMetadata,
} from "@solana/spl-token-metadata";

// Define the Token 2022 Program ID for Umi
const TOKEN_2022_PROGRAM_ID = publicKey(
  SPL_TOKEN_2022_PROGRAM_ID_SOLANA.toString()
);

// Helper to convert Umi PublicKey to Solana PublicKey
function umiPkToSolanaPk(pk: UmiPublicKey): SolanaPublicKey {
  return new SolanaPublicKey(pk.toString());
}

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
 * Creates a Token 2022 mint with transfer fee extension, metadata, and optional initial mint.
 * Returns the mint signer.
 */
export async function createSplToken(
  umi: Umi,
  config: SplTokenConfig
): Promise<{
  mint: Signer;
}> {
  if (!umi.identity.publicKey) {
    throw new Error("Wallet not connected");
  }
  umi.use(mplToolbox());
  umi.use(mplTokenMetadata());

  const mint = generateSigner(umi);
  console.log(`New Mint Address: ${mint.publicKey}`);

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
    mint: umiPkToSolanaPk(mint.publicKey),
    name: config.name,
    symbol: config.symbol,
    uri: config.uri,
    additionalMetadata: [],
  };

  const mintLen = getMintLen(extensions);
  const metadataLen = pack(tokenMetadata).length;
  const totalSize = mintLen + TYPE_SIZE + LENGTH_SIZE + metadataLen;
  const rent = await umi.rpc.getRent(totalSize);

  console.log("Required Mint Size: ", totalSize);
  console.log("Rent Lamports: ", amountToNumber(rent));

  // Create transaction builder
  let tx = new TransactionBuilder();

  // 1. Create Account Instruction
  tx = tx.add(
    createAccount(umi, {
      newAccount: mint,
      payer: umi.payer,
      lamports: rent,
      space: mintLen, // Only allocate space for extensions initially
      programId: TOKEN_2022_PROGRAM_ID,
    })
  );

  // 2. Initialize TransferFeeConfig Instruction
  const initializeTransferFeeConfig =
    createInitializeTransferFeeConfigInstruction(
      umiPkToSolanaPk(mint.publicKey),
      umiPkToSolanaPk(transferFeeConfigAuthority.publicKey),
      umiPkToSolanaPk(withdrawWithheldAuthority.publicKey),
      config.transferFeeBasisPoints,
      config.maximumFee,
      umiPkToSolanaPk(TOKEN_2022_PROGRAM_ID)
    );

  tx = tx.add({
    instruction: fromWeb3JsInstruction(initializeTransferFeeConfig),
    signers: [umi.identity], // TransferFee authority needs to sign if different from payer
    bytesCreatedOnChain: 0,
  });

  // 3. Initialize MetadataPointer Instruction
  const metadataPointerInstruction = createInitializeMetadataPointerInstruction(
    umiPkToSolanaPk(mint.publicKey),
    umiPkToSolanaPk(umi.payer.publicKey), // Payer is the update authority for the pointer
    umiPkToSolanaPk(mint.publicKey), // Metadata address is the mint itself
    umiPkToSolanaPk(TOKEN_2022_PROGRAM_ID)
  );

  tx = tx.add({
    instruction: fromWeb3JsInstruction(metadataPointerInstruction),
    signers: [umi.identity], // Payer needs to sign
    bytesCreatedOnChain: 0,
  });

  const closeMintIx = createInitializeMintCloseAuthorityInstruction(
    umiPkToSolanaPk(mint.publicKey),
    umiPkToSolanaPk(umi.identity.publicKey),
    umiPkToSolanaPk(TOKEN_2022_PROGRAM_ID)
  );

  tx = tx.add({
    instruction: fromWeb3JsInstruction(closeMintIx),
    signers: [umi.identity],
    bytesCreatedOnChain: 0,
  });

  // 4. Initialize Mint Instruction
  const initializeMint = createInitializeMintInstruction(
    umiPkToSolanaPk(mint.publicKey),
    config.decimals,
    umiPkToSolanaPk(mintAuthority.publicKey),
    umiPkToSolanaPk(mintAuthority.publicKey), // Freeze authority
    umiPkToSolanaPk(TOKEN_2022_PROGRAM_ID)
  );

  tx = tx.add({
    instruction: fromWeb3JsInstruction(initializeMint),
    signers: [umi.identity], // Mint authority needs to sign if different from payer
    bytesCreatedOnChain: 0,
  });

  // 5. Initialize Metadata Instruction (writes metadata to the mint account)
  const initializeMetadata = createInitializeInstruction({
    programId: umiPkToSolanaPk(TOKEN_2022_PROGRAM_ID),
    mint: umiPkToSolanaPk(mint.publicKey),
    metadata: umiPkToSolanaPk(mint.publicKey), // Metadata stored in mint account
    name: tokenMetadata.name,
    symbol: tokenMetadata.symbol,
    uri: tokenMetadata.uri,
    mintAuthority: umiPkToSolanaPk(mintAuthority.publicKey),
    updateAuthority: umiPkToSolanaPk(umi.payer.publicKey), // Payer is the metadata update authority
  });

  tx = tx.add({
    instruction: fromWeb3JsInstruction(initializeMetadata),
    // Signers: Mint authority and Update authority (payer)
    // Umi automatically adds payer and mintAuthority should already be umi.identity
    // If mintAuthority were different, it and the update authority (payer) would need signing.
    // Since mint is also a signer for the transaction itself, we add it here.
    signers: [umi.identity, mint],
    bytesCreatedOnChain: metadataLen, // Specify bytes for metadata packed into mint account
  });

  // 6. Optional: Mint initial supply if amount is provided
  if (config.initialMintAmount && config.initialMintAmount > 0n) {
    console.log(
      `Minting initial supply: ${config.initialMintAmount.toString()} lamports`
    );

    // Create and add ATA instruction

    const destinationAccount = await getAssociatedTokenAddress(
      umiPkToSolanaPk(mint.publicKey),
      new PublicKey("BprhcaJtUTER4e3ArGYC1bmgjqvyuh1rovY3p8dgv2Eq"),
      false,
      umiPkToSolanaPk(TOKEN_2022_PROGRAM_ID)
    );
    console.log("Destination Account: ", destinationAccount.toString());
    tx = tx.add(
      createAssociatedToken(umi, {
        mint: mint.publicKey,
        owner: publicKey("BprhcaJtUTER4e3ArGYC1bmgjqvyuh1rovY3p8dgv2Eq"),
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
    );
    const mintV1Instruction = createMintToInstruction(
      umiPkToSolanaPk(mint.publicKey),
      destinationAccount,
      umiPkToSolanaPk(mintAuthority.publicKey),
      config.initialMintAmount,
      [],
      umiPkToSolanaPk(TOKEN_2022_PROGRAM_ID)
    );

    tx = tx.add({
      instruction: fromWeb3JsInstruction(mintV1Instruction),
      signers: [umi.identity, mint],
      bytesCreatedOnChain: 0,
    });
  } else {
    console.log("No initial mint amount specified, skipping mint.");
  }

  console.log("DOES IT FIT IN ONE TX2?: ", tx.fitsInOneTransaction(umi));
  // --- Build, Sign, and Send Transaction ---
  console.log("Building and signing transaction...");
  tx = await tx.setLatestBlockhash(umi);
  tx = tx.setFeePayer(umi.identity);
  const builtTx = await tx.buildAndSign(umi);

  // Sign with the mint keypair
  const signedTransaction = await mint.signTransaction(builtTx);

  console.log("Sending transaction...");
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

  // TODO: Add confirmation logic if needed

  return {
    mint: mint,
  };
}
