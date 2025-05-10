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
import type { HeliusAssetData } from "@workspace/types"; // Import the shared type
import fs from "fs";
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
    "/:id/pool",
    async ({ params, set }) => {
      try {
        const { id } = params;

        if (!id) {
          set.status = 400;
          return { error: "Token ID is required" };
        }

        // Get token information
        const db = getDb();
        const token = await db.query.tokens.findFirst({
          where: eq(tokens.tokenMintAddress, id),
        });

        if (!token) {
          set.status = 404;
          return {
            error: "Token not found",
            message: `No token found with mint address: ${id}`,
          };
        }

        // Get pool information
        const pool = await db.query.pools.findFirst({
          where: eq(pools.tokenMintAddress, id),
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
          poolAddress: pool?.poolAddress || "",
        };
      } catch (error: any) {
        console.error("[tokens/:id/pool GET]", error);
        set.status = 500;
        return {
          error: "Internal server error",
          message: error?.message || "Failed to fetch token pool",
        };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      response: {
        200: t.Object(
          {
            tokenMintAddress: t.String(),
            tokenSymbol: t.String(),
            tokenName: t.String(),
            decimals: t.Number(),
            transferFeeBasisPoints: t.Number(),
            maximumFee: t.String(),
            metadataUri: t.String(),
            targetMarketCap: t.String(),
            poolAddress: t.String(),
          },
          {
            additionalProperties: true,
          }
        ),
        400: t.Object({
          error: t.String(),
          message: t.Optional(t.String()),
        }),
        404: t.Object({
          error: t.String(),
          message: t.Optional(t.String()),
        }),
        500: t.Object({
          error: t.String(),
          message: t.Optional(t.String()),
        }),
      },
    }
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      try {
        const { id } = params;

        if (!id) {
          set.status = 400;
          return { error: "Token ID is required" };
        }

        const RPC_URL = process.env.RPC_URL;

        if (!RPC_URL) {
          console.error(
            "[tokens/:id GET] RPC_URL environment variable not set."
          );
          set.status = 500;
          return { error: "Server configuration error" };
        }
        console.log("ABOUT TO FETCH ASSET: ", id);

        const response = await fetch(RPC_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: "token-lookup-" + id,
            method: "getAsset",
            params: { id: id, displayOptions: { showFungible: true } },
          }),
        });
        console.log("RESPONSE: ", response);
        if (!response.ok) {
          const errorBody = await response.text();
          console.error(
            `[tokens/:id GET] Helius API request failed with status ${response.status}: ${errorBody}`
          );
          // Set appropriate status based on upstream failure
          set.status = response.status === 404 ? 404 : 502; // Use 404 if Helius 404s, else 502
          return {
            error:
              response.status === 404
                ? "Token not found via Helius API"
                : "Failed to fetch data from Helius API",
            message: errorBody,
          };
        }

        const data = await response.json();
        const tokenData = data.result as HeliusAssetData;
        // write data.result to a file
        fs.writeFileSync("data.json", JSON.stringify(tokenData, null, 2));
        // log all keys of data.result
        console.log("DATA KEYS: ", Object.keys(tokenData));
        if (!tokenData) {
          console.warn(
            `[tokens/:id GET] Helius API returned no result for ID: ${id}`
          );
          set.status = 404;
          return { error: "Token not found" };
        }

        // Success: Return the result directly.
        return tokenData;
      } catch (err: any) {
        // Catch errors from fetch/JSON parsing or unexpected issues
        console.error("[tokens/:id GET] Internal processing error:", err);
        set.status = 500;
        return { error: "Internal Server Error", message: err?.message };
      }
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      // Update response schema to include error responses
      response: {
        // Success response
        200: t.Object(
          {
            interface: t.String(),
            id: t.String(),
            content: t.Optional(
              t.Object({
                metadata: t.Optional(
                  t.Object({
                    name: t.Optional(t.String()),
                    symbol: t.Optional(t.String()),
                    description: t.Optional(t.String()),
                    attributes: t.Optional(
                      t.Array(
                        t.Object({
                          trait_type: t.String(),
                          value: t.String(),
                        })
                      )
                    ),
                  })
                ),
                files: t.Optional(
                  t.Array(
                    t.Object({
                      uri: t.String(),
                      cdn_uri: t.String(),
                      mime: t.String(),
                    })
                  )
                ),
                links: t.Optional(
                  t.Object({
                    image: t.Optional(t.String()),
                  })
                ),
              })
            ),
            grouping: t.Optional(
              t.Array(
                t.Object({
                  group_key: t.String(),
                  group_value: t.String(),
                })
              )
            ),
            ownership: t.Optional(
              t.Object({
                owner: t.Optional(t.String()),
              })
            ),
            token_info: t.Optional(
              t.Object({
                supply: t.Optional(t.Number()),
                decimals: t.Optional(t.Number()),
                token_program: t.Optional(t.String()),
                mint_authority: t.Optional(t.String()),
                freeze_authority: t.Optional(t.String()),
              })
            ),
            mint_extensions: t.Optional(
              t.Object({
                transfer_fee_config: t.Optional(
                  t.Object({
                    newer_transfer_fee: t.Optional(
                      t.Object({
                        transfer_fee_basis_points: t.Optional(t.Number()),
                      })
                    ),
                  })
                ),
              })
            ),
          },
          {
            additionalProperties: true,
          }
        ),
        // Error responses
        400: t.Object({
          error: t.String(),
          message: t.Optional(t.String()),
        }),
        404: t.Object({
          error: t.String(),
          message: t.Optional(t.String()),
        }),
        500: t.Object({
          error: t.String(),
          message: t.Optional(t.String()),
        }),
        502: t.Object({
          error: t.String(),
          message: t.Optional(t.String()),
        }),
      },
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
