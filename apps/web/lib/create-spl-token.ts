import {
  Umi,
  generateSigner,
  PublicKey as UmiPublicKey,
  publicKey,
  Signer,
  Pda,
  amountToNumber,
  TransactionBuilder,
} from "@metaplex-foundation/umi";
import {
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  createInitializeTransferFeeConfigInstruction,
  ExtensionType,
  getMintLen,
  LENGTH_SIZE,
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID as SPL_TOKEN_2022_PROGRAM_ID_SOLANA,
  TYPE_SIZE,
} from "@solana/spl-token";
import { PublicKey as SolanaPublicKey, SystemProgram } from "@solana/web3.js";
import {
  mplTokenMetadata,
  findMetadataPda,
} from "@metaplex-foundation/mpl-token-metadata";
import { createAccount, mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import { fromWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters";
import { base58 } from "@metaplex-foundation/umi/serializers";
import {
  createInitializeInstruction,
  createUpdateFieldInstruction,
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
  initialMintAmount?: bigint;
  transferFeeConfigAuthority?: Signer;
  withdrawWithheldAuthority?: Signer;
}

/**
 * Creates a Token 2022 mint with transfer fee extension, metadata, and optional initial mint.
 * Returns a TransactionBuilder ready to be sent.
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

  // const extensionJustTransferFeeConfig = [ExtensionType.TransferFeeConfig];
  // const mintLenWithTransferFeeConfig = getMintLen(
  //   extensionJustTransferFeeConfig
  // );
  const extensions = [
    ExtensionType.TransferFeeConfig,
    ExtensionType.MetadataPointer,
  ];
  const metadata: TokenMetadata = {
    mint: umiPkToSolanaPk(mint.publicKey),
    name: "TOKEN_NAME",
    symbol: "SMBL",
    uri: "URI",
    additionalMetadata: [],
  };
  const mintLen = getMintLen(extensions);
  const size = mintLen + TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
  const rent = await umi.rpc.getRent(size);

  console.log("MINT LEN: ", MINT_SIZE);
  console.log("RENT: ", amountToNumber(rent));

  // Create transaction builder
  let tx = new TransactionBuilder();

  tx = tx.add(
    createAccount(umi, {
      newAccount: mint,
      payer: umi.payer,
      lamports: rent,
      space: mintLen,
      programId: TOKEN_2022_PROGRAM_ID,
    })
  );

  console.log("HERE?3");
  // Instruction to initialize TransferFeeConfig Extension
  const initializeTransferFeeConfig =
    createInitializeTransferFeeConfigInstruction(
      umiPkToSolanaPk(mint.publicKey), // Mint Account address
      umiPkToSolanaPk(transferFeeConfigAuthority.publicKey), // Authority to update fees
      umiPkToSolanaPk(withdrawWithheldAuthority.publicKey), // Authority to withdraw fees
      50, // Basis points for transfer fee calculation
      100000n, // Maximum fee per transfer
      umiPkToSolanaPk(TOKEN_2022_PROGRAM_ID) // Token Extension Program ID
    );

  tx = tx.add({
    instruction: fromWeb3JsInstruction(initializeTransferFeeConfig),
    signers: [umi.identity],
    bytesCreatedOnChain: 0,
  });
  const metadataInstruction = createInitializeMetadataPointerInstruction(
    umiPkToSolanaPk(mint.publicKey),
    umiPkToSolanaPk(umi.payer.publicKey),
    umiPkToSolanaPk(mint.publicKey),
    umiPkToSolanaPk(TOKEN_2022_PROGRAM_ID)
  );

  tx = tx.add({
    instruction: fromWeb3JsInstruction(metadataInstruction),
    signers: [umi.identity, mint],
    bytesCreatedOnChain: 0,
  });
  // Instruction to initialize Mint Account data
  const initializeMintInstruction = createInitializeMintInstruction(
    umiPkToSolanaPk(mint.publicKey), // Mint Account Address
    6, // Decimals of Mint
    umiPkToSolanaPk(mintAuthority.publicKey), // Designated Mint Authority
    umiPkToSolanaPk(mintAuthority.publicKey),
    umiPkToSolanaPk(TOKEN_2022_PROGRAM_ID) // Token Extension Program ID
  );

  tx = tx.add({
    instruction: fromWeb3JsInstruction(initializeMintInstruction),
    signers: [umi.identity],
    bytesCreatedOnChain: 0,
  });
  console.log("HERE?4");

  const initializeMetadataInstruction = createInitializeInstruction({
    programId: umiPkToSolanaPk(TOKEN_2022_PROGRAM_ID),
    mint: umiPkToSolanaPk(mint.publicKey),
    metadata: umiPkToSolanaPk(mint.publicKey),
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadata.uri,
    mintAuthority: umiPkToSolanaPk(mintAuthority.publicKey),
    updateAuthority: umiPkToSolanaPk(umi.payer.publicKey),
  });

  tx = tx.add({
    instruction: fromWeb3JsInstruction(initializeMetadataInstruction),
    signers: [umi.identity, mint],
    bytesCreatedOnChain: 0,
  });

  tx = await tx.setLatestBlockhash(umi);
  tx = tx.setFeePayer(umi.identity);
  const built = await tx.buildAndSign(umi);

  const mintTransaction = await mint.signTransaction(built);

  const result = await umi.rpc.sendTransaction(mintTransaction, {
    skipPreflight: true,
  });

  console.log(`Transaction Signature: ${base58.deserialize(result)[0]}`);

  // const mintTransaction = new Transaction().add(
  //   SystemProgram.createAccount({
  //     fromPubkey: umiPkToSolanaPk(umi.identity.publicKey),
  //     newAccountPubkey: umiPkToSolanaPk(mint.publicKey),
  //     space: mintLen,
  //     lamports: amountToNumber(mintLamports),
  //     programId: umiPkToSolanaPk(TOKEN_2022_PROGRAM_ID),
  //   }),
  //   // createInitializeTransferFeeConfigInstruction(
  //   //   umiPkToSolanaPk(mint.publicKey),
  //   //   umiPkToSolanaPk(transferFeeConfigAuthority.publicKey),
  //   //   umiPkToSolanaPk(withdrawWithheldAuthority.publicKey),
  //   //   config.transferFeeBasisPoints,
  //   //   config.maximumFee,
  //   //   umiPkToSolanaPk(TOKEN_2022_PROGRAM_ID)
  //   // ),
  //   createInitializeMintInstruction(
  //     umiPkToSolanaPk(mint.publicKey),
  //     config.decimals,
  //     umiPkToSolanaPk(mintAuthority.publicKey),
  //     null,
  //     umiPkToSolanaPk(TOKEN_2022_PROGRAM_ID)
  //   )
  // );
  // const mintKP = toWeb3JsKeypair(mint);
  // console.log("MINT K1P", mintKP);
  // const latestBlockhash = await umi.rpc.getLatestBlockhash();
  // mintTransaction.feePayer = umiPkToSolanaPk(umi.identity.publicKey);
  // mintTransaction.recentBlockhash = latestBlockhash.blockhash;
  // mintTransaction.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight;
  // // Convert it using the UmiWeb3jsAdapters Package
  // console.log("BROS?");
  return {
    mint: mint,
  };
}
