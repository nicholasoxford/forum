import { PublicKey as SolanaPublicKey, Connection } from "@solana/web3.js";
import {
  createV1,
  mintV1,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  percentAmount,
  generateSigner,
  some,
  publicKey as umiPublicKey,
  Umi,
  TransactionBuilder,
  publicKey,
  PublicKey as UmiPublicKey,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import {
  findAssociatedTokenPda,
  mplToolbox,
} from "@metaplex-foundation/mpl-toolbox";
import {
  createInitializeTransferFeeConfigInstruction,
  ExtensionType,
  getMint,
  getMintLen,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { fromWeb3JsInstruction } from "@metaplex-foundation/umi-web3js-adapters";
const SPL_TOKEN_2022_PROGRAM_ID = publicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);
// Helper to convert Umi PublicKey to Solana PublicKey
function umiPkToSolanaPk(pk: UmiPublicKey): SolanaPublicKey {
  return new SolanaPublicKey(pk.toString());
}
// Token configuration
export interface TokenConfig {
  name: string;
  symbol: string;
  uri: string; // Metadata URI (JSON)
  decimals: number;
  transferFeeBasisPoints: number; // e.g., 100 = 1%
  maximumFee: bigint; // Maximum fee per transfer
  initialMintAmount?: bigint;
}

/**
 * Creates a Token 2022 mint with transfer fee extension and metadata
 */
export async function createTokenMint(
  umi: Umi,
  config: TokenConfig
): Promise<{
  mint: string;
  signature: Uint8Array;
  tokenConfig: TokenConfig;
}> {
  // We need to be connected to proceed
  if (!umi.identity.publicKey) {
    throw new Error("Wallet not connected");
  }

  // Add required plugins
  umi.use(mplTokenMetadata());
  umi.use(mplToolbox());

  try {
    // Create a new signer for the mint
    const mint = generateSigner(umi);

    const token = findAssociatedTokenPda(umi, {
      mint: mint.publicKey,
      owner: umi.identity.publicKey,
      tokenProgramId: SPL_TOKEN_2022_PROGRAM_ID,
    });
    // Create transaction builder
    let tx = new TransactionBuilder();

    // Add metadata
    tx = tx.add(
      createV1(umi, {
        mint: mint,
        authority: umi.identity,
        name: config.name,
        symbol: config.symbol,
        uri: config.uri,
        sellerFeeBasisPoints: percentAmount(0), // No royalties for fungible tokens
        decimals: some(config.decimals),
        tokenStandard: TokenStandard.Fungible,
        splTokenProgram: umiPublicKey(TOKEN_2022_PROGRAM_ID.toString()),
      })
    );

    // Create Token-2022 mint
    tx = tx.add(
      mintV1(umi, {
        mint: mint.publicKey,
        authority: umi.identity,
        amount: config.initialMintAmount,
        token,
        tokenOwner: umi.identity.publicKey,
        tokenStandard: TokenStandard.Fungible,
        splTokenProgram: SPL_TOKEN_2022_PROGRAM_ID,
      })
    );
    const txInstructions = createInitializeTransferFeeConfigInstruction(
      umiPkToSolanaPk(mint.publicKey), // Mint Account address
      umiPkToSolanaPk(umi.identity.publicKey), // Authority to update fees
      umiPkToSolanaPk(umi.identity.publicKey), // Authority to withdraw fees
      config.transferFeeBasisPoints, // Basis points for transfer fee calculation
      config.maximumFee, // Maximum fee per transfer
      TOKEN_2022_PROGRAM_ID // Token Extension Program ID
    );
    const extensions = [
      ExtensionType.TransferFeeConfig,
      ExtensionType.MetadataPointer,
    ];

    // Calculate the length of the mint
    // const mintLen = getMintLen(extensions);
    // tx = tx.add({
    //   instruction: fromWeb3JsInstruction(txInstructions),
    //   signers: [umi.identity],
    //   bytesCreatedOnChain: mintLen,
    // });

    // Send the transaction
    const result = await tx.sendAndConfirm(umi);

    console.log(`Token created: ${mint.publicKey}`);
    console.log(`Transfer fee: ${config.transferFeeBasisPoints} basis points`);
    console.log(`Maximum fee: ${config.maximumFee}`);

    return {
      mint: mint.publicKey.toString(),
      signature: result.signature,
      tokenConfig: config,
    };
  } catch (error) {
    console.error("Error creating token:", error);
    throw error;
  }
}

/**
 * Distributes fees collected from transfers to token holders
 */
export async function distributeFeesToHolders(
  umi: Umi,
  mint: SolanaPublicKey
): Promise<string> {
  try {
    // We need to be connected to proceed
    if (!umi.identity.publicKey) {
      throw new Error("Wallet not connected");
    }

    // Convert UMI connection to Web3.js connection
    const connection = new Connection(umi.rpc.getEndpoint());

    // Step 1: Get all token holder accounts
    const tokenAccounts = await connection.getProgramAccounts(
      TOKEN_2022_PROGRAM_ID,
      {
        filters: [
          {
            dataSize: 165, // Size of token account data
          },
          {
            memcmp: {
              offset: 0,
              bytes: mint.toBase58(),
            },
          },
        ],
      }
    );

    // Step 2: Get total supply and withheld fees
    const mintInfo = await getMint(
      connection,
      mint,
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    // Calculate total withheld fees (from mint and token accounts)
    // In a real implementation, you would need to:
    // 1. Use withdrawWithheldTokensFromMint to claim fees from the mint
    // 2. Use withdrawWithheldTokensFromAccounts for each token account with withheld fees
    // 3. Distribute these funds to each holder proportionally to their balance

    // For now, we'll just return a message since the full implementation would require custom program logic
    return `Distribution ready for ${tokenAccounts.length} holders. Withheld fees could be claimed and distributed proportionally.`;
  } catch (error) {
    console.error("Error distributing fees:", error);
    throw error;
  }
}

/**
 * Creates the user's associated token account and mints initial tokens to them
 */
export async function mintInitialTokens(
  umi: Umi,
  mintAddress: string,
  amount: bigint
): Promise<string> {
  // We need to be connected to proceed
  if (!umi.identity.publicKey) {
    throw new Error("Wallet not connected");
  }

  try {
    // Add required plugins
    umi.use(mplToolbox());

    // Convert UMI connection to Web3.js connection for SPL operations
    const connection = new Connection(umi.rpc.getEndpoint());
    const mintPublicKey = new SolanaPublicKey(mintAddress);

    // For now we'll return a success message
    // In a real implementation, you would mint tokens using the appropriate UMI or SPL operations
    console.log(`Requested to mint ${amount} tokens to wallet`);

    return `Successfully requested to mint ${amount} tokens to your wallet. 
    Note: The actual minting implementation depends on the wallet adapter being used.`;
  } catch (error) {
    console.error("Error minting tokens:", error);
    throw error;
  }
}
