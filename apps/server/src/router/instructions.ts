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
import { createSolanaConnection } from "@workspace/solana";
import bs58 from "bs58";
import { createBuyIX, createSellIX, getPoolInfo } from "@workspace/services";
// Default pool settings - can be overridden in request
const DEFAULT_SHIFT = 100; // 100 virtual SOL
const DEFAULT_ROYALTIES_BPS = 100; // 1%

export const instructionsRouter = new Elysia({ prefix: "/instructions" })
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
      body: t.Object({
        tokenMintAddress: t.String({
          error: "Token mint address must be a string",
        }),
        userAddress: t.String({ error: "User address must be a string" }),
        amount: t.Number({ error: "Amount must be a number" }),
        slippageBps: t.Optional(
          t.Number({ error: "Slippage must be a number" })
        ),
      }),
      response: {
        200: t.Object({
          serializedTransaction: t.String(),
        }),
        400: t.Object({
          error: t.String(),
          message: t.String(),
        }),
        404: t.Object({
          error: t.String(),
          message: t.String(),
        }),
        500: t.Object({
          error: t.String(),
          message: t.String(),
        }),
      },
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
      body: t.Object({
        tokenMintAddress: t.String({
          error: "Token mint address must be a string",
        }),
        userAddress: t.String({ error: "User address must be a string" }),
        amount: t.Number({
          error: "Amount (of token to sell) must be a number",
        }),
        slippageBps: t.Optional(
          t.Number({ error: "Slippage must be a number" })
        ),
      }),
      response: {
        200: t.Object({
          serializedTransaction: t.String(),
          poolAddress: t.String(),
        }),
        // Use t.Object for error responses for consistency
        400: t.Object({
          name: t.String(),
          message: t.String(),
          status: t.Number(),
        }),
        404: t.Object({
          name: t.String(),
          message: t.String(),
          status: t.Number(),
        }),
        500: t.Object({
          name: t.String(),
          message: t.String(),
          status: t.Number(),
        }),
      },
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

      // 1. Load Vertigo admin wallet from environment
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
      body: t.Object({
        ownerAddress: t.String({ error: "Owner address must be a string" }),
        mintB: t.String({
          error: "Token mint address (mintB) must be a string",
        }),
        tokenWallet: t.String({
          error: "Token wallet address must be a string",
        }),
        tokenName: t.String({ error: "Token name must be a string" }),
        tokenSymbol: t.String({ error: "Token symbol must be a string" }),
        shift: t.Optional(
          t.Number({ default: DEFAULT_SHIFT, error: "Shift must be a number" })
        ),
        royaltiesBps: t.Optional(
          t.Number({
            default: DEFAULT_ROYALTIES_BPS,
            error: "Royalties BPS must be a number",
          })
        ),
      }),
      response: {
        200: t.Object({
          poolAddress: t.String(),
          signature: t.String(),
          mintB: t.String(),
        }),
        // Use Elysia's default error handling or define specific error objects
        // Keeping simplified error structure for now
        400: t.Object({
          // For validation or bad input errors
          name: t.String(),
          message: t.String(),
          status: t.Number(),
        }),
        500: t.Object({
          // For internal server errors
          name: t.String(),
          message: t.String(),
          status: t.Number(),
        }),
      },
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
      body: t.Object({
        userAddress: t.String({ error: "User address must be a string" }),
      }),
      response: {
        200: t.Object({
          serializedTransaction: t.String(),
        }),
        // Provide specific error schemas based on potential failures
        400: t.Object({
          // For client errors like no wSOL account or zero balance
          name: t.String(),
          message: t.String(),
          status: t.Number(),
        }),
        500: t.Object({
          // For internal server errors
          name: t.String(),
          message: t.String(),
          status: t.Number(),
        }),
      },
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
      body: t.Object({
        poolAddress: t.String({ error: "Pool address must be a string" }),
        ownerAddress: t.String({ error: "Owner address must be a string" }),
        mintA: t.Optional(
          t.String({ default: NATIVE_MINT.toString() }) // Default mintA to wSOL
        ),
      }),
      response: {
        200: t.Object({
          signature: t.String(),
          poolAddress: t.String(),
          receiverAddress: t.String(),
        }),
        // Define potential error responses
        400: t.Object({
          // Bad Request (e.g., missing ATA)
          name: t.String(),
          message: t.String(),
          status: t.Number(),
        }),
        404: t.Object({
          // Not Found (e.g., pool doesn't exist)
          name: t.String(),
          message: t.String(),
          status: t.Number(),
        }),
        500: t.Object({
          // Internal Server Error
          name: t.String(),
          message: t.String(),
          status: t.Number(),
        }),
      },
    }
  );
