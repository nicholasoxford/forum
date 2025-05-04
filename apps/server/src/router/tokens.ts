import { Elysia, t } from "elysia";
import { getDb, tokens, pools, users, groupChats } from "@workspace/db";
import { eq } from "drizzle-orm";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { createTelegramChannel } from "@workspace/telegram";
import { launchPool } from "@workspace/vertigo";
import { createSolanaConnection } from "@workspace/solana";

// Define the schema for the launch token request body
const LaunchTokenBodySchema = t.Object({
  tokenMintAddress: t.String(),
  tokenSymbol: t.String(),
  tokenName: t.String(),
  decimals: t.Number(),
  transferFeeBasisPoints: t.Number(),
  maximumFee: t.String(), // Keep as string for precision
  metadataUri: t.Optional(t.String()),
  creatorWalletAddress: t.String(),
  creatorUsername: t.Optional(t.String()),
  creatorTelegramUserId: t.Optional(t.String()),
  requiredHoldings: t.String(), // Keep as string
  targetMarketCap: t.Optional(t.String()), // Keep as string
});

export const tokensRouter = new Elysia({ prefix: "/tokens" })
  .get(
    "/",
    async ({ set }) => {
      try {
        const db = getDb();
        const timeStart = performance.now();
        // Query all tokens and join with their respective pools
        const allTokens = await db
          .select({
            token: tokens,
            pool: pools,
          })
          .from(tokens)
          .leftJoin(pools, eq(tokens.tokenMintAddress, pools.tokenMintAddress));
        const timeEnd = performance.now();
        // log in ms
        console.log(`[tokens GET] ${timeEnd - timeStart}ms`);
        // Format the response
        const formattedTokens = allTokens.map(({ token, pool }) => ({
          tokenMintAddress: token.tokenMintAddress,
          tokenName: token.tokenName,
          tokenSymbol: token.tokenSymbol,
          decimals: token.decimals,
          transferFeeBasisPoints: token.transferFeeBasisPoints,
          metadataUri: token.metadataUri || "",
          creatorWalletAddress: token.creatorWalletAddress,
          pool: pool
            ? {
                poolAddress: pool.poolAddress,
                ownerAddress: pool.ownerAddress,
                mintA: pool.mintA,
                mintB: pool.mintB,
                shift: Number(pool.shift),
                initialTokenReserves: Number(pool.initialTokenReserves),
                royaltiesBps: Number(pool.royaltiesBps || 0),
              }
            : null,
        }));

        return formattedTokens;
      } catch (error: any) {
        console.error("[tokens GET]", error);
        set.status = 500;
        throw new Error(error?.message || "Failed to fetch tokens");
      }
    },
    {
      response: t.Array(
        t.Object({
          tokenMintAddress: t.String(),
          tokenName: t.String(),
          tokenSymbol: t.String(),
          decimals: t.Number(),
          transferFeeBasisPoints: t.Number(),
          metadataUri: t.String(),
          creatorWalletAddress: t.String(),
          pool: t.Union([
            t.Object({
              poolAddress: t.String(),
              ownerAddress: t.String(),
              mintA: t.String(),
              mintB: t.String(),
              shift: t.Number(),
              initialTokenReserves: t.Number(),
              royaltiesBps: t.Number(),
            }),
            t.Null(),
          ]),
        })
      ),
    }
  )
  .get(
    "/:tokenMint/pool",
    async ({ params }) => {
      try {
        const { tokenMint } = params;

        if (!tokenMint) {
          throw new Error("Token mint address is required");
        }

        // Get token information
        const db = getDb();
        const token = await db.query.tokens.findFirst({
          where: eq(tokens.tokenMintAddress, tokenMint),
        });

        if (!token) {
          throw new Error("Token not found");
        }

        // Get pool information
        const pool = await db.query.pools.findFirst({
          where: eq(pools.tokenMintAddress, tokenMint),
        });

        return {
          tokenMintAddress: token.tokenMintAddress,
          tokenSymbol: token.tokenSymbol,
          tokenName: token.tokenName,
          decimals: token.decimals,
          transferFeeBasisPoints: token.transferFeeBasisPoints,
          maximumFee: String(token.maximumFee || "0"),
          metadataUri: token.metadataUri || "",
          targetMarketCap: String(token.targetMarketCap || "0"),
        };
      } catch (error: any) {
        console.error("[tokens/:tokenMint/pool GET]", error);
        throw new Error(error?.message || "Failed to fetch token pool");
      }
    },
    {
      params: t.Object({
        tokenMint: t.String(),
      }),
      response: t.Object({
        tokenMintAddress: t.String(),
        tokenSymbol: t.String(),
        tokenName: t.String(),
        decimals: t.Number(),
        transferFeeBasisPoints: t.Number(),
        maximumFee: t.String(),
        metadataUri: t.String(),
        targetMarketCap: t.String(),
      }),
    }
  )
  .get(
    "/balance",
    async ({ query }) => {
      try {
        const { wallet, mint } = query;

        if (!wallet || !mint) {
          return new Response(
            JSON.stringify({
              error: "Missing required parameters: wallet and mint",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Validate addresses
        let walletPubkey: PublicKey;
        let mintPubkey: PublicKey;

        try {
          walletPubkey = new PublicKey(wallet);
          mintPubkey = new PublicKey(mint);
        } catch (error) {
          return new Response(
            JSON.stringify({ error: "Invalid wallet or mint address" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Connect to Solana
        const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
        const connection = new Connection(RPC_URL, "confirmed");

        // Find the token account address (ATA)
        const tokenAccountAddress = await getAssociatedTokenAddress(
          mintPubkey,
          walletPubkey,
          false,
          TOKEN_2022_PROGRAM_ID
        );

        let balance;
        // Try to get the token balance
        try {
          balance =
            await connection.getTokenAccountBalance(tokenAccountAddress);
        } catch (error) {
          // If getting the balance fails, the token account might not exist yet
          // which means the user has 0 tokens
          return {
            wallet,
            mint,
            balance: {
              amount: "0",
              decimals: 0,
              uiAmount: 0,
              uiAmountString: "0",
            },
            tokenAccount: tokenAccountAddress.toString(),
            exists: false,
          };
        }

        // Return the balance info
        return {
          wallet,
          mint,
          balance: balance.value,
          tokenAccount: tokenAccountAddress.toString(),
          exists: true,
        };
      } catch (error: any) {
        console.error("[token balance GET]", error);
        return new Response(
          JSON.stringify({
            error: "Failed to get token balance",
            message: error?.message,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    },
    {
      query: t.Object({
        wallet: t.String(),
        mint: t.String(),
      }),
    }
  )
  .post(
    "/launch-token",
    async ({ body, set }) => {
      try {
        // Body is now automatically validated and typed by Elysia
        const {
          tokenMintAddress,
          tokenSymbol,
          tokenName,
          decimals,
          transferFeeBasisPoints,
          maximumFee,
          metadataUri,
          creatorWalletAddress,
          creatorUsername,
          creatorTelegramUserId,
          requiredHoldings,
          targetMarketCap,
        } = body; // No need for 'as any' or manual validation block

        const db = getDb();

        // 1. Ensure the user (creator) exists in the `users` table (idempotent)
        await db
          .insert(users)
          .values({
            walletAddress: creatorWalletAddress,
            username: creatorUsername,
            telegramUserId: creatorTelegramUserId,
          })
          .onDuplicateKeyUpdate({
            set: {
              username: creatorUsername,
              telegramUserId: creatorTelegramUserId,
            },
          });

        // 2. Insert the new token
        await db.insert(tokens).values({
          tokenMintAddress,
          tokenSymbol,
          tokenName,
          decimals,
          transferFeeBasisPoints,
          maximumFee,
          metadataUri,
          targetMarketCap: targetMarketCap || null,
          creatorWalletAddress,
        });

        // 3. Create a dedicated Telegram channel for this token
        let telegramChannelId: string | null = null;
        let telegramUsername: string | null = null;
        try {
          // TODO: Import and implement createTelegramChannel logic for server
          const { channelId, username } = await createTelegramChannel(
            `${tokenSymbol} Holders`,
            `Official chat for ${tokenName} (${tokenSymbol}) token holders.`
          );
          telegramChannelId = channelId;
          telegramUsername = username;
          // Persist channel info in group_chats table
          await db.insert(groupChats).values({
            tokenMintAddress,
            telegramChatId: channelId,
            telegramUsername: username,
            tokenSymbol,
            tokenName,
            requiredHoldings: requiredHoldings || "0",
            creatorWalletAddress,
          });
        } catch (tgError) {
          console.error("Failed to create Telegram channel", tgError);
          // Not fatal for token creation; continue.
        }

        // TODO: Load VERTIGO_SECRET_KEY from environment

        // Load wallet keypair from environment variable
        const secretKeyEnv = process.env.VERTIGO_SECRET_KEY;
        if (!secretKeyEnv) {
          throw new Error("VERTIGO_SECRET_KEY environment variable not set.");
        }
        const walletKeypair = Keypair.fromSecretKey(
          base58.serialize(secretKeyEnv)
        );
        const connection = await createSolanaConnection();

        const DEFAULT_SHIFT = 100;
        const DEFAULT_ROYALTIES_BPS = 100;
        // TODO: This owner address seems hardcoded, verify if it should be dynamic or from env
        const OWNER_ADDRESS = "8jTiTDW9ZbMHvAD9SZWvhPfRx5gUgK7HACMdgbFp2tUz";

        const result = await launchPool(connection, {
          tokenName,
          tokenSymbol,
          poolParams: {
            shift: DEFAULT_SHIFT,
            initialTokenReserves: 1_000_000,
            decimals: decimals,
            feeParams: {
              normalizationPeriod: 20,
              decay: 10,
              royaltiesBps: DEFAULT_ROYALTIES_BPS,
              feeExemptBuys: 1,
            },
          },
          ownerAddress: walletKeypair.publicKey.toString(),
          existingToken: {
            mintB: new PublicKey(tokenMintAddress),
            // TODO: Determine the correct token wallet address logic
            tokenWallet: new PublicKey(OWNER_ADDRESS),
            walletAuthority: walletKeypair,
          },
        });

        // Save pool information to the new pools table
        await db.insert(pools).values({
          poolAddress: result.poolAddress,
          tokenMintAddress,
          ownerAddress: walletKeypair.publicKey.toString(),
          mintA: "So11111111111111111111111111111111111111112",
          mintB: tokenMintAddress,
          shift: DEFAULT_SHIFT.toString(),
          initialTokenReserves: "1000000",
          royaltiesBps: DEFAULT_ROYALTIES_BPS,
          transactionSignature: result.signature,
        });

        return {
          success: true,
          telegramChannelId,
          telegramUsername,
          poolAddress: result.poolAddress,
          transactionSignature: result.signature,
        };
      } catch (error: any) {
        console.error("[tokens POST /launch-token]", error);
        set.status = 500;
        return { error: "Internal Server Error", message: error?.message };
      }
    },
    {
      // Add the schema validation here
      body: LaunchTokenBodySchema,
    }
  );
