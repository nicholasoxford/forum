import { getDb, tokens, pools, users, groupChats } from "@workspace/db";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import { base58 } from "@metaplex-foundation/umi/serializers";
import { createTelegramChannel } from "@workspace/telegram";
import { launchPool } from "@workspace/vertigo";
import { createSolanaConnection } from "@workspace/solana";
import {
  LaunchTokenParams,
  LaunchTokenResult,
  DEFAULT_SHIFT,
  DEFAULT_ROYALTIES_BPS,
  OWNER_ADDRESS,
  GetAllTokensResult,
  GetTokenPoolResult,
  HeliusAssetData,
  GetTokenBalanceResult,
} from "@workspace/types";
import { eq } from "drizzle-orm";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

async function ensureUserExists(
  params: Pick<
    LaunchTokenParams,
    "creatorWalletAddress" | "creatorUsername" | "creatorTelegramUserId"
  >
) {
  const db = getDb();
  console.log({ params });
  await db
    .insert(users)
    .values({
      walletAddress: params.creatorWalletAddress,
    })
    .onDuplicateKeyUpdate({
      set: {
        walletAddress: params.creatorWalletAddress,
      },
    });
}

async function createToken(params: LaunchTokenParams) {
  const db = getDb();
  await db.insert(tokens).values({
    tokenMintAddress: params.tokenMintAddress,
    tokenSymbol: params.tokenSymbol,
    tokenName: params.tokenName,
    decimals: params.decimals,
    transferFeeBasisPoints: params.transferFeeBasisPoints,
    maximumFee: params.maximumFee,
    metadataUri: params.metadataUri,
    targetMarketCap: params.targetMarketCap || null,
    creatorWalletAddress: params.creatorWalletAddress,
  });
}

async function createTelegramChannelForToken(
  params: Pick<
    LaunchTokenParams,
    | "tokenSymbol"
    | "tokenName"
    | "tokenMintAddress"
    | "creatorWalletAddress"
    | "requiredHoldings"
  >
) {
  let telegramChannelId: string | null = null;
  let telegramUsername: string | null = null;

  try {
    const { channelId, username } = await createTelegramChannel(
      `${params.tokenSymbol} Holders`,
      `Official chat for ${params.tokenName} (${params.tokenSymbol}) token holders.`
    );
    telegramChannelId = channelId;
    telegramUsername = username;

    const db = getDb();
    await db.insert(groupChats).values({
      tokenMintAddress: params.tokenMintAddress,
      telegramChatId: channelId,
      telegramUsername: username,
      tokenSymbol: params.tokenSymbol,
      tokenName: params.tokenName,
      requiredHoldings: params.requiredHoldings || "0",
      creatorWalletAddress: params.creatorWalletAddress,
    });
  } catch (tgError) {
    console.error("Failed to create Telegram channel", tgError);
  }

  return { telegramChannelId, telegramUsername };
}

async function createPool(
  params: Pick<
    LaunchTokenParams,
    | "tokenName"
    | "tokenSymbol"
    | "decimals"
    | "tokenMintAddress"
    | "privilegedBuyerAddress"
    | "privilegedBuyerAmount"
    | "privilegedBuyerLimit"
  >
) {
  const secretKeyEnv = process.env.VERTIGO_SECRET_KEY;
  if (!secretKeyEnv) {
    throw new Error("VERTIGO_SECRET_KEY environment variable not set.");
  }

  const walletKeypair = Keypair.fromSecretKey(base58.serialize(secretKeyEnv));
  const connection = await createSolanaConnection();

  // Prepare the privileged buyer info if provided
  let privilegedBuyer = undefined;
  if (
    params.privilegedBuyerAddress &&
    params.privilegedBuyerAmount &&
    params.privilegedBuyerLimit
  ) {
    privilegedBuyer = {
      publicKey: new PublicKey(params.privilegedBuyerAddress),
      amount: Number(params.privilegedBuyerAmount),
      limit: Number(params.privilegedBuyerLimit),
    };
  }

  const result = await launchPool(connection, {
    tokenName: params.tokenName,
    tokenSymbol: params.tokenSymbol,
    poolParams: {
      shift: DEFAULT_SHIFT,
      initialTokenReserves: 1_000_000,
      decimals: params.decimals,
      feeParams: {
        normalizationPeriod: 20,
        decay: 10,
        royaltiesBps: DEFAULT_ROYALTIES_BPS,
        feeExemptBuys: 1,
      },
    },
    ownerAddress: walletKeypair.publicKey.toString(),
    existingToken: {
      mintB: new PublicKey(params.tokenMintAddress),
      tokenWallet: new PublicKey(OWNER_ADDRESS),
      walletAuthority: walletKeypair,
    },
    privilegedBuyer,
  });

  return { result, walletKeypair };
}

async function savePoolInfo(params: {
  poolAddress: string;
  tokenMintAddress: string;
  ownerAddress: string;
  transactionSignature: string;
  privilegedBuyerSignature?: string;
}) {
  const db = getDb();
  await db.insert(pools).values({
    poolAddress: params.poolAddress,
    tokenMintAddress: params.tokenMintAddress,
    ownerAddress: params.ownerAddress,
    mintA: "So11111111111111111111111111111111111111112",
    mintB: params.tokenMintAddress,
    shift: DEFAULT_SHIFT.toString(),
    initialTokenReserves: "1000000",
    royaltiesBps: DEFAULT_ROYALTIES_BPS,
    transactionSignature: params.transactionSignature,
    privilegedBuyerSignature: params.privilegedBuyerSignature || null,
  });
}

export async function launchToken(
  params: LaunchTokenParams
): Promise<LaunchTokenResult> {
  // 1. Ensure the user exists
  console.log("ENSURING USER EXISTS");
  await ensureUserExists(params);
  console.log("USER EXISTS");
  // 2. Create the token
  await createToken(params);
  console.log("TOKEN CREATED");

  // 4. Create and save pool
  const { result, walletKeypair } = await createPool(params);
  await savePoolInfo({
    poolAddress: result.poolAddress,
    tokenMintAddress: params.tokenMintAddress,
    ownerAddress: walletKeypair.publicKey.toString(),
    transactionSignature: result.signature,
    privilegedBuyerSignature: result.privilegedBuySignature,
  });
  console.log("POOL CREATED");
  return {
    success: true,
    poolAddress: result.poolAddress,
    transactionSignature: result.signature,
    privilegedBuyerSignature: result.privilegedBuySignature,
  };
}
export function getPoolPda(
  owner: PublicKey,
  mintA: PublicKey,
  mintB: PublicKey,
  programId: PublicKey
): [PublicKey, number] {
  const POOL_SEED = "pool";
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(POOL_SEED),
      owner.toBuffer(),
      mintA.toBuffer(),
      mintB.toBuffer(),
    ],
    programId
  );
}

export async function getAllTokens(): Promise<GetAllTokensResult[]> {
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
  console.log(`[getAllTokens service] ${timeEnd - timeStart}ms`);
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
}

export async function getTokenPool(id: string): Promise<GetTokenPoolResult> {
  const db = getDb();
  const token = await db.query.tokens.findFirst({
    where: eq(tokens.tokenMintAddress, id),
  });

  if (!token) {
    // Consider throwing a custom error or returning a more specific structure
    // that the router can use to set the status code.
    throw new Error(`Token not found with mint address: ${id}`);
  }

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
}

export async function getTokenById(id: string): Promise<HeliusAssetData> {
  const RPC_URL = process.env.RPC_URL;
  if (!RPC_URL) {
    console.error(
      "[getTokenById service] RPC_URL environment variable not set."
    );
    // Consistently throw errors from the service layer
    throw new Error("Server configuration error: RPC_URL not set.");
  }

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

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(
      `[getTokenById service] Helius API request failed with status ${response.status}: ${errorBody}`
    );
    // Create a custom error object to convey status and message
    const error = new Error(
      response.status === 404
        ? "Token not found via Helius API"
        : "Failed to fetch data from Helius API"
    ) as any; // Cast to any to add a status property
    error.status = response.status; // Store the original status code
    error.details = errorBody; // Store the error body from Helius
    throw error;
  }

  const data: any = await response.json(); // Explicitly type data as any
  const tokenData = data.result as HeliusAssetData;

  if (!tokenData) {
    console.warn(
      `[getTokenById service] Helius API returned no result for ID: ${id}`
    );
    const error = new Error(
      "Token not found via Helius API (no result data)"
    ) as any;
    error.status = 404;
    throw error;
  }

  return tokenData;
}

export async function getTokenBalance(
  wallet: string,
  mint: string
): Promise<GetTokenBalanceResult> {
  let walletPubkey: PublicKey;
  let mintPubkey: PublicKey;

  try {
    walletPubkey = new PublicKey(wallet);
    mintPubkey = new PublicKey(mint);
  } catch (error) {
    // Throw an error that can be caught by the router to set a 400 status
    const err = new Error("Invalid wallet or mint address") as any;
    err.status = 400;
    throw err;
  }

  const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
  const connection = new Connection(RPC_URL, "confirmed");

  const tokenAccountAddress = await getAssociatedTokenAddress(
    mintPubkey,
    walletPubkey
  );

  try {
    const balanceInfo =
      await connection.getTokenAccountBalance(tokenAccountAddress);
    return {
      wallet,
      mint,
      balance: {
        amount: balanceInfo.value.amount,
        decimals: balanceInfo.value.decimals,
        uiAmount:
          balanceInfo.value.uiAmount === undefined
            ? null
            : balanceInfo.value.uiAmount,
        uiAmountString:
          balanceInfo.value.uiAmountString === undefined
            ? "0"
            : balanceInfo.value.uiAmountString,
      },
      tokenAccount: tokenAccountAddress.toString(),
      exists: true,
    };
  } catch (error) {
    // If getting the balance fails, the token account might not exist
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
}
