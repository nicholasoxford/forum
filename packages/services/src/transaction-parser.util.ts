import { PublicKey } from "@solana/web3.js";
import { BorshInstructionCoder } from "@coral-xyz/anchor";
import { base58 } from "@metaplex-foundation/umi/serializers";
import ammIdl from "@vertigo-amm/vertigo-sdk/dist/target/idl/amm.json";
import { Amm } from "@vertigo-amm/vertigo-sdk/dist/target/types/amm";

export const VERTIGO_PROGRAM_ID = "vrTGoBuy5rYSxAfV3jaRJWHH6nN9WK4NRExGxsk1bCJ";
export const SOL_MINT = "So11111111111111111111111111111111111111112";

/**
 * Parses Vertigo program instructions from a transaction
 */
export function parseInstructions(
  tx: any
): Array<{ name: string; data: any } | null> {
  const VERTIGO_PROGRAM_ID_PUBKEY = new PublicKey(VERTIGO_PROGRAM_ID);
  const coder = new BorshInstructionCoder(ammIdl as Amm);
  console.log("YO");

  return tx.message.instructions?.map((rawInstruction: any) => {
    const accountKeys = tx.message.accountKeys.map((pk: any) => pk);
    const programId = accountKeys[rawInstruction.programIndex];

    if (programId !== VERTIGO_PROGRAM_ID_PUBKEY.toBase58()) {
      return null;
    }

    const dataAsBase58 = base58.deserialize(
      Buffer.from(rawInstruction.data)
    )[0];
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

/**
 * Calculates token balance changes from transaction data
 */
export function calculateTokenBalanceChanges(tx: any): Array<{
  account: string;
  mint: string;
  change: string;
  identifier: "SOL" | "SPL";
  owner?: string;
  preAmount?: string;
  postAmount?: string;
  isPositive?: boolean;
  decimals?: number;
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
      // Handle different token amount formats between TransactionResponse and parsed transaction
      if ((post.amount as any)?.basisPoints) {
        postAmount = (post.amount as any)?.basisPoints || BigInt(0);
        preAmount = (pre?.amount as any)?.basisPoints || BigInt(0);
      } else if (post.uiTokenAmount) {
        postAmount = BigInt(post.uiTokenAmount.amount);
        preAmount = pre ? BigInt(pre.uiTokenAmount.amount) : BigInt(0);
      }
    } catch (error) {
      console.warn(`Failed to convert amount to BigInt:`, {
        postAmount: post.amount || post.uiTokenAmount,
        preAmount: pre?.amount || pre?.uiTokenAmount,
        error,
      });
      postAmount = BigInt(0);
      preAmount = BigInt(0);
    }

    const change = postAmount - preAmount;
    const isPositive = change > BigInt(0);

    // Determine identifier and decimals
    let identifier: "SOL" | "SPL" = "SPL";
    let decimals: number;

    if (post.mint.toString() === SOL_MINT) {
      identifier = "SOL";
      decimals = 9;
    } else {
      // Get decimals from token data
      decimals =
        (post.amount as any)?.decimals || post.uiTokenAmount?.decimals || 6;
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

    // Get pre and post UI amounts for display
    const preUiAmount =
      pre?.uiTokenAmount?.uiAmount ||
      (pre?.amount as any)?.uiAmount ||
      (Number(preAmount) / Math.pow(10, decimals)).toFixed(decimals);

    const postUiAmount =
      post.uiTokenAmount?.uiAmount ||
      (post.amount as any)?.uiAmount ||
      (Number(postAmount) / Math.pow(10, decimals)).toFixed(decimals);

    return {
      account: post.owner?.toString(),
      mint: post.mint.toString(),
      change: uiChange,
      identifier,
      owner: post.owner?.toString(),
      preAmount: preUiAmount.toString(),
      postAmount: postUiAmount.toString(),
      isPositive,
      decimals,
    };
  });
}

/**
 * Calculates transaction fee from transaction data
 */
export function calculateTransactionFee(tx: any): {
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

/**
 * Extracts token transfers from a transaction
 */
export function extractTokenTransfers(txData: any) {
  try {
    const transfers: any[] = [];

    // Find SPL token transfer instructions in inner instructions
    if (txData.transaction?.meta?.innerInstructions) {
      txData.transaction.meta.innerInstructions.forEach((inner: any) => {
        if (inner.instructions) {
          inner.instructions.forEach((ix: any) => {
            // Look for SPL token transfer instructions
            if (
              ix.program === "spl-token" &&
              ix.parsed &&
              (ix.parsed.type === "TransferChecked" ||
                ix.parsed.type === "Transfer")
            ) {
              transfers.push({
                type: ix.parsed.type,
                source: ix.parsed.info.source,
                destination: ix.parsed.info.destination,
                amount: ix.parsed.info.amount,
                mint: ix.parsed.info.mint,
                decimals: ix.parsed.info.decimals,
                authority: ix.parsed.info.authority,
              });
            }
          });
        }
      });
    }

    return transfers.length > 0 ? transfers : null;
  } catch (error) {
    console.error(`Error extracting token transfers: ${error}`);
    return null;
  }
}
