import { Connection, PublicKey } from "@solana/web3.js";
import { buyTokens } from "@workspace/vertigo";
import { NATIVE_MINT } from "@solana/spl-token";
import { BorshInstructionCoder } from "@coral-xyz/anchor";
import { base58 } from "@metaplex-foundation/umi/serializers";
import ammIdl from "@vertigo-amm/vertigo-sdk/dist/target/idl/amm.json";
import { Amm } from "@vertigo-amm/vertigo-sdk/dist/target/types/amm";

export async function createBuyIX({
  connection,
  poolAddress,
  userAddress,
  amount,
  slippageBps,
  tokenMintAddress,
}: {
  connection: Connection;
  poolAddress: string;
  userAddress: string;
  tokenMintAddress: string;
  amount: number;
  slippageBps: number;
}) {
  const poolAccountAddress = new PublicKey(poolAddress);
  const userAccountAddress = new PublicKey(userAddress);

  const buyTokensInstruction = await buyTokens(connection, {
    poolOwner: poolAccountAddress.toString(),
    mintA: NATIVE_MINT.toString(),
    mintB: tokenMintAddress,
    userAddress: userAccountAddress.toString(),
    amount,
    slippageBps,
  }).catch((error) => {
    console.error(error);
    throw error;
  });

  return buyTokensInstruction;
}

export interface ParsedBuyTransaction {
  success: boolean;
  status: "success" | "failed";
  instruction?: {
    name: string;
    data: {
      params: {
        amount: string;
        limit: string;
      };
    };
  };
  balanceChanges: Array<{
    account: string;
    mint: string;
    change: string;
    identifier: "SOL" | "SPL";
  }>;
  fee: {
    amount: string;
    identifier: "SOL";
  };
}

// Parse instructions from a transaction
function parseInstructions(tx: any): Array<{ name: string; data: any } | null> {
  const VERTIGO_PROGRAM_ID = new PublicKey(
    "vrTGoBuy5rYSxAfV3jaRJWHH6nN9WK4NRExGxsk1bCJ"
  );
  const coder = new BorshInstructionCoder(ammIdl as Amm);

  return tx.message.instructions?.map((rawInstruction: any) => {
    const accountKeys = tx.message.accounts.map((pk: any) => pk.toString());
    const programId = accountKeys[rawInstruction.programIndex];

    if (programId !== VERTIGO_PROGRAM_ID.toBase58()) {
      return null;
    }
    console.log({ DATA: Buffer.from(rawInstruction.data) });
    const dataAsBase58 = base58.deserialize(
      Buffer.from(rawInstruction.data)
    )[0];
    console.log({ DATA_AS_BASE58: dataAsBase58 });
    const decoded = coder.decode(dataAsBase58, "base58");

    if (!decoded) {
      return null;
    }

    let processedData = decoded.data;
    if (decoded.name === "buy" && (decoded.data as any)?.params) {
      const params = (decoded.data as any).params;
      const newParams: { [key: string]: string } = {};
      for (const [key, value] of Object.entries(params)) {
        if (value && typeof (value as any).toString === "function") {
          newParams[key] = (value as any).toString();
        } else {
          newParams[key] = String(value);
        }
      }
      processedData = { ...(processedData as object), params: newParams };
    }
    return { name: decoded.name, data: processedData };
  });
}

// Calculate token balance changes
function calculateTokenBalanceChanges(tx: any): Array<{
  account: string;
  mint: string;
  change: string;
  identifier: "SOL" | "SPL";
}> {
  const preTokenBalances = tx.meta.preTokenBalances || [];
  const postTokenBalances = tx.meta.postTokenBalances || [];

  return postTokenBalances.map((post: any) => {
    const pre = preTokenBalances.find(
      (p: any) =>
        p.owner?.toString() === post.owner?.toString() &&
        p.mint.toString() === post.mint.toString()
    );

    // Safe BigInt conversion with error handling
    let postAmount = BigInt(0);
    let preAmount = BigInt(0);

    try {
      // Use basisPoints directly since it's already a BigInt
      postAmount = (post.amount as any)?.basisPoints || BigInt(0);
      preAmount = (pre?.amount as any)?.basisPoints || BigInt(0);
    } catch (error) {
      console.warn(`Failed to convert amount to BigInt:`, {
        postAmount: post.amount,
        preAmount: pre?.amount,
        error,
      });
      postAmount = BigInt(0);
      preAmount = BigInt(0);
    }

    const change = postAmount - preAmount;

    // Determine identifier and decimals
    let identifier: "SOL" | "SPL" = "SPL";
    let decimals = (post.amount as any)?.decimals || 6;

    if (
      post.mint.toString() === "So11111111111111111111111111111111111111112"
    ) {
      identifier = "SOL";
      decimals = 9;
    }

    // Safe UI amount calculation
    let uiChange = "0";
    try {
      uiChange = (Number(change) / Math.pow(10, decimals)).toFixed(decimals);
    } catch (error) {
      console.warn(`Failed to calculate UI amount:`, {
        change: change.toString(),
        decimals,
        error,
      });
      uiChange = "0";
    }

    return {
      account: post.owner?.toString(),
      mint: post.mint.toString(),
      change: uiChange,
      identifier,
    };
  });
}

// Calculate transaction fee
function calculateTransactionFee(tx: any): {
  amount: string;
  identifier: "SOL";
} {
  const feeObject = tx.meta?.fee as { basisPoints?: bigint | number | string };
  let feeUiAmount = "0.000000000";

  if (feeObject && typeof feeObject.basisPoints !== "undefined") {
    const feeBasisPoints =
      typeof feeObject.basisPoints === "bigint"
        ? feeObject.basisPoints.toString()
        : String(feeObject.basisPoints);
    const numericFee = Number(feeBasisPoints);
    feeUiAmount = (numericFee / Math.pow(10, 9)).toFixed(9);
  }

  return {
    amount: feeUiAmount,
    identifier: "SOL",
  };
}

export async function parseBuyTransaction(
  tx: any
): Promise<ParsedBuyTransaction> {
  const processedInstructions = parseInstructions(tx);
  const tokenBalanceChanges = calculateTokenBalanceChanges(tx);
  const fee = calculateTransactionFee(tx);

  return {
    success: true,
    status: tx.meta?.err ? "failed" : "success",
    instruction: processedInstructions?.find(
      (ix: { name: string; data: any } | null) => ix !== null
    ),
    balanceChanges: tokenBalanceChanges.filter(
      (change: { change: string }) => change.change !== "0"
    ),
    fee,
  };
}
