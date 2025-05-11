import { Elysia, t, NotFoundError } from "elysia";
import { getDb } from "@workspace/db";
import { PublicKey, Keypair } from "@solana/web3.js";
import {
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import {
  launchPool,
  createUnwrapSolTransaction,
  claimPoolRoyalties,
  verifyTokenAccountExists,
} from "@workspace/vertigo";
import { createSolanaConnection, initializeUmi } from "@workspace/solana";
import bs58 from "bs58";
import {
  createBuyIX,
  createSellIX,
  getPoolInfo,
  createSplTokenTransaction,
} from "@workspace/services";
import {
  BuyInstructionBodySchema,
  BuyInstructionResponseSchema,
  SellInstructionBodySchema,
  SellInstructionResponseSchema,
  CreateToken2022BodySchema,
  CreateToken2022ResponseSchema,
  LaunchPoolBodySchema,
  LaunchPoolResponseSchema,
  UnwrapSolBodySchema,
  UnwrapSolResponseSchema,
  ClaimRoyaltiesBodySchema,
  ClaimRoyaltiesResponseSchema,
} from "@workspace/schemas";

// Default pool settings - can be overridden in request
const DEFAULT_SHIFT = 100; // 100 virtual SOL
const DEFAULT_ROYALTIES_BPS = 100; // 1%

export const instructionsRouter = new Elysia({
  prefix: "/instructions",
  detail: {
    tags: ["Instructions"],
  },
})
  .post(
    "/buy",
    async ({
      body: { tokenMintAddress, userAddress, amount, slippageBps = 100 },
    }) => {
      // Get pool information from database
      const db = getDb();
      const connection = await createSolanaConnection();
      const poolInfo = await getPoolInfo({
        tokenMintAddress,
        db,
        connection,
      });

      const serializedTx = await createBuyIX({
        connection,
        poolAddress: poolInfo.ownerAddress,
        userAddress,
        amount,
        slippageBps,
        tokenMintAddress,
      });

      return {
        serializedTransaction: serializedTx,
      };
    },
    {
      body: BuyInstructionBodySchema,
      response: BuyInstructionResponseSchema,
    }
  )
  .post(
    "/sell",
    async ({
      body: { tokenMintAddress, userAddress, amount, slippageBps = 100 },
    }) => {
      // 1. Get pool information from database
      const db = getDb();
      const connection = await createSolanaConnection();
      const poolInfo = await getPoolInfo({
        tokenMintAddress,
        db,
        connection,
      });
      // 3. Get serialized transaction for selling tokens

      const serializedTx = await createSellIX({
        connection,
        poolAddress: poolInfo.ownerAddress,
        userAddress,
        amount,
        slippageBps,
        tokenMintAddress,
      });

      console.log(
        `[instructions/sell] Successfully generated sell transaction for pool: ${poolInfo.poolAddress}`
      );

      return {
        serializedTransaction: serializedTx,
        poolAddress: poolInfo.poolAddress,
      };
    },
    {
      body: SellInstructionBodySchema,
      response: SellInstructionResponseSchema,
    }
  )
  .post(
    "/create-token-2022",
    async ({ body }) => {
      const {
        name,
        symbol,
        uri,
        decimals,
        transferFeeBasisPoints,
        maximumFee,
        initialMintAmount,
        userAddress,
      } = body;

      try {
        console.log(
          `[instructions/create-token-2022] Creating token transaction for user: ${userAddress}`
        );

        // Create a UMI instance for the server context

        // In production, uncomment and use the following code:
        const tokenConfig = {
          name,
          symbol,
          uri,
          decimals,
          transferFeeBasisPoints,
          maximumFee: BigInt(maximumFee),
          initialMintAmount: initialMintAmount
            ? BigInt(initialMintAmount)
            : undefined,
        };

        const umi = initializeUmi();
        console.log("Creating token transaction...");
        const result = await createSplTokenTransaction(
          umi,
          tokenConfig,
          userAddress
        );
        return {
          serializedTransaction: result.serializedTransaction,
          mintAddress: result.mint.publicKey.toString(),
        };
      } catch (error: any) {
        console.error("[instructions/create-token-2022] Error:", error);
        throw new Error(error?.message || "Failed to create token transaction");
      }
    },
    {
      body: CreateToken2022BodySchema,
      response: CreateToken2022ResponseSchema,
    }
  )
  .post(
    "/launch-pool",
    async ({ body }) => {
      const {
        ownerAddress, // This is the user initiating the launch
        mintB,
        tokenWallet,
        tokenName,
        tokenSymbol,
        shift = DEFAULT_SHIFT,
        royaltiesBps = DEFAULT_ROYALTIES_BPS,
      } = body;

      // 1. Load Vertigo amin wallet from environment
      const vertigoSecretKey = process.env.VERTIGO_SECRET_KEY;
      if (!vertigoSecretKey) {
        console.error("[instructions/launch-pool] VERTIGO_SECRET_KEY not set");
        throw new Error("Server configuration error: Missing secret key.");
      }
      const vertigoWalletKeypair = Keypair.fromSecretKey(
        bs58.decode(vertigoSecretKey)
      );

      // 2. Establish Solana connection
      const connection = await createSolanaConnection();

      // 3. Validate mint and token wallet existence (optional but recommended)
      try {
        const mintPubkey = new PublicKey(mintB);
        const mintInfo = await connection.getAccountInfo(mintPubkey);
        if (!mintInfo) {
          throw new Error(`Invalid mint address: ${mintB} does not exist.`);
        }

        const tokenWalletPubkey = new PublicKey(tokenWallet);
        const walletInfo = await connection.getAccountInfo(tokenWalletPubkey);
        if (!walletInfo) {
          throw new Error(
            `Invalid token wallet address: ${tokenWallet} does not exist.`
          );
        }
        // Basic check: Ensure the token wallet owner matches the vertigoWalletKeypair public key
        // This assumes the vertigo admin wallet is the authority over the token account holding the initial supply
        // Adjust if the ownerAddress from the request should be the authority
        // const tokenAccountInfo = await connection.getTokenAccountBalance(tokenWalletPubkey); // More robust check needed if authority differs
        // if (walletInfo.owner.toString() !== vertigoWalletKeypair.publicKey.toString()) {
        //   console.warn(`[instructions/launch-pool] Token wallet ${tokenWallet} owner does not match Vertigo admin wallet.`);
        //    // Depending on requirements, this might be an error or just a warning.
        //    // throw new Error(`Token wallet authority mismatch.`);
        // }
      } catch (validationError: any) {
        console.error(
          "[instructions/launch-pool] Token validation failed:",
          validationError
        );
        // Use Bad Request for validation errors
        throw new Error(`Validation Error: ${validationError.message}`); // Re-throw with clearer context
      }

      // 4. Call launchPool from Vertigo SDK
      try {
        console.log(
          `[instructions/launch-pool] Launching pool for token: ${mintB} by user ${ownerAddress}`
        );
        const result = await launchPool(connection, {
          tokenName,
          tokenSymbol,
          poolParams: {
            shift,
            // These might need adjustment based on actual token details fetched on-chain if needed
            initialTokenReserves: 1_000_000, // Placeholder, as original code didn't use actual reserves for existing tokens
            decimals: 6, // Placeholder, ideally fetch from mint info
            feeParams: {
              normalizationPeriod: 20,
              decay: 10,
              royaltiesBps,
              feeExemptBuys: 1,
            },
          },
          // Use the user's address from the request as the pool owner?
          // Or the vertigo admin wallet? Original code used walletKeypair.publicKey
          ownerAddress: vertigoWalletKeypair.publicKey.toString(), // Using Vertigo admin for now
          existingToken: {
            mintB: new PublicKey(mintB),
            tokenWallet: new PublicKey(tokenWallet),
            // Authority should be the keypair that owns the tokenWallet account
            walletAuthority: vertigoWalletKeypair,
          },
        });

        console.log(
          `[instructions/launch-pool] Pool launched successfully! Pool: ${result.poolAddress}, Tx: ${result.signature}`
        );

        // TODO: Store pool info in the database here if needed

        return {
          poolAddress: result.poolAddress.toString(),
          signature: result.signature,
          mintB: mintB, // Return mintB for confirmation
        };
      } catch (launchError: any) {
        console.error(
          "[instructions/launch-pool] Error calling launchPool:",
          launchError
        );
        throw new Error(launchError?.message || "Failed to launch pool.");
      }
    },
    {
      body: LaunchPoolBodySchema,
      response: LaunchPoolResponseSchema,
    }
  )
  .post(
    "/unwrap-sol",
    async ({ body }) => {
      const { userAddress } = body;

      const connection = await createSolanaConnection();

      try {
        // Call the centralized function directly
        const serializedTx = await createUnwrapSolTransaction(
          connection,
          userAddress
        );

        console.log(
          `[instructions/unwrap-sol] Successfully generated unwrap transaction for ${userAddress}`
        );

        return {
          serializedTransaction: serializedTx,
        };
      } catch (error: any) {
        console.error(
          "[instructions/unwrap-sol] Error creating unwrap SOL transaction:",
          error
        );

        // Propagate error, Vertigo function should handle specific messages
        throw error; // Re-throw the error from createUnwrapSolTransaction
      }
    },
    {
      body: UnwrapSolBodySchema,
      response: UnwrapSolResponseSchema,
    }
  )
  .post(
    "/claim-royalties",
    async ({ body }) => {
      const {
        poolAddress,
        ownerAddress, // User's wallet address initiating the claim
        mintA = NATIVE_MINT.toString(), // Default to wSOL if not provided
      } = body;

      const connection = await createSolanaConnection();

      try {
        // 1. Calculate the receiver's Associated Token Account (ATA)
        const ownerPublicKey = new PublicKey(ownerAddress);
        const mintPublicKey = new PublicKey(mintA);

        const receiverTaA = getAssociatedTokenAddressSync(
          mintPublicKey,
          ownerPublicKey,
          false, // Allow owner off-curve
          TOKEN_PROGRAM_ID // Specify the token program (usually standard SPL token program for wSOL)
        ).toString();

        console.log(`[instructions/claim-royalties] Pool: ${poolAddress}`);
        console.log(`[instructions/claim-royalties] Owner: ${ownerAddress}`);
        console.log(`[instructions/claim-royalties] Mint A: ${mintA}`);
        console.log(
          `[instructions/claim-royalties] Receiver ATA: ${receiverTaA}`
        );

        // 2. Optional but recommended: Verify the receiver ATA exists before calling claim
        //    This provides a clearer error message to the user if the ATA is missing.
        if (!(await verifyTokenAccountExists(connection, receiverTaA))) {
          throw new Error(
            `Associated Token Account (${receiverTaA}) for mint ${mintA} and owner ${ownerAddress} does not exist. Please create it first.`
          );
        }

        // 3. Call the claimPoolRoyalties function (which uses the server's keypair to execute)
        const signature = await claimPoolRoyalties(connection, {
          poolAddress,
          mintA,
          receiverTaA,
          ownerAddress, // Pass ownerAddress for logging/context within claimPoolRoyalties
        });

        console.log(
          `[instructions/claim-royalties] Successfully claimed royalties for pool ${poolAddress}. Tx: ${signature}`
        );

        // 4. Return the transaction signature
        return {
          signature: signature,
          poolAddress: poolAddress,
          receiverAddress: receiverTaA,
        };
      } catch (error: any) {
        console.error(
          "[instructions/claim-royalties] Error claiming royalties:",
          error
        );
        // Improve error propagation
        const errorMessage = error?.message || "Failed to claim royalties.";
        // Check for specific errors we know about
        if (errorMessage.includes("Pool does not exist")) {
          throw new NotFoundError(`Claim failed: ${errorMessage}`);
        }
        if (
          errorMessage.includes("Associated Token Account") ||
          errorMessage.includes("Receiver token account does not exist")
        ) {
          // Use Bad Request for client-side issues like missing ATA
          // Rethrow with status 400 or use Elysia's error handling
          throw new Error(`Claim failed: ${errorMessage}`); // Or throw new BadRequestError(...) if using Elysia errors
        }
        if (errorMessage.includes("server configuration issue")) {
          // Internal server error
          throw new Error("Claim failed due to a server issue."); // Hide internal details
        }

        // General internal server error
        throw new Error(`Claim failed: ${errorMessage}`); // Default to 500
      }
    },
    {
      body: ClaimRoyaltiesBodySchema,
      response: ClaimRoyaltiesResponseSchema,
    }
  );
