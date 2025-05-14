import { Umi, Transaction, TransactionBuilder } from "@metaplex-foundation/umi";
import {
  setComputeUnitLimit,
  setComputeUnitPrice,
} from "@metaplex-foundation/mpl-toolbox";
import { base64 } from "@metaplex-foundation/umi/serializers";

/**
 * Calculates the optimal priority fee based on recent transactions
 * for accounts in the transaction
 * @param umi - The Umi instance
 * @param transaction - The transaction to calculate the fee for
 * @returns The average priority fee in microLamports
 */
export const getPriorityFee = async (
  umi: Umi,
  transaction: TransactionBuilder
): Promise<number> => {
  // Get unique writable accounts involved in the transaction
  const distinctPublicKeys = new Set<string>();

  transaction.items.forEach((item) => {
    item.instruction.keys.forEach((key) => {
      if (key.isWritable) {
        distinctPublicKeys.add(key.pubkey.toString());
      }
    });
  });

  // If no writable accounts, return a default value
  if (distinctPublicKeys.size === 0) {
    return 1000; // Default micro-lamports if no writable accounts
  }

  // Query recent prioritization fees
  const response = await fetch(umi.rpc.getEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getRecentPrioritizationFees",
      params: [Array.from(distinctPublicKeys)],
    }),
  });

  if (!response.ok) {
    console.warn(
      `Failed to fetch priority fees: ${response.status}, using default`
    );
    return 1000; // Default if request fails
  }

  const data = (await response.json()) as {
    result: { prioritizationFee: number; slot: number }[];
  };
  // Calculate average of top 100 fees
  const fees = data.result?.map((entry) => entry.prioritizationFee) || [];
  if (fees.length === 0) return 1000; // Default if no fee data

  const topFees = fees.sort((a, b) => b - a).slice(0, 100);
  const averageFee = Math.ceil(
    topFees.reduce((sum, fee) => sum + fee, 0) / topFees.length
  );

  return Math.max(averageFee, 1); // Ensure at least 1 microLamport
};

/**
 * Estimates the required compute units for a transaction
 * @param umi - The Umi instance
 * @param transaction - The transaction to estimate compute units for
 * @returns Estimated compute units needed with safety buffer
 */
export const getRequiredCU = async (
  umi: Umi,
  transaction: Transaction
): Promise<number> => {
  const DEFAULT_COMPUTE_UNITS = 200_000; // Conservative default
  const BUFFER_FACTOR = 1.1; // 10% safety margin
  console.log("ABOUT TO CALL SIMULATE");
  const simulation = await umi.rpc.simulateTransaction(transaction, {
    verifySignatures: false,
  });
  console.log("Simulation:", simulation);
  try {
    // Simulate the transaction to get actual compute units needed
    const response = await fetch(umi.rpc.getEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "simulateTransaction",
        params: [
          base64.deserialize(umi.transactions.serialize(transaction))[0],
          {
            encoding: "base64",
            replaceRecentBlockhash: true,
            sigVerify: false,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn(
        `Simulation failed with status ${response.status}, using default CU`
      );
      return DEFAULT_COMPUTE_UNITS;
    }

    const parsedData = (await response.json()) as {
      result?: { value?: { unitsConsumed?: number } };
    };
    const unitsConsumed = parsedData.result?.value?.unitsConsumed;

    if (!unitsConsumed) {
      console.warn("Simulation didn't return compute units, using default");
      return DEFAULT_COMPUTE_UNITS;
    }

    // Add safety buffer
    return Math.min(
      Math.ceil(unitsConsumed * BUFFER_FACTOR),
      1_400_000 // Maximum allowed compute units
    );
  } catch (error) {
    console.warn("Error estimating compute units:", error);
    return DEFAULT_COMPUTE_UNITS;
  }
};

/**
 * Optimizes a transaction with appropriate compute units and priority fees
 * @param umi - The Umi instance
 * @param transaction - Transaction builder to optimize
 * @returns Optimized transaction builder
 */
export const optimizeTransaction = async (
  umi: Umi,
  transaction: TransactionBuilder
): Promise<TransactionBuilder> => {
  try {
    // Calculate optimal priority fee
    const priorityFee = await getPriorityFee(umi, transaction);
    console.log(`Using priority fee: ${priorityFee} microLamports`);

    // First add maximum CU for simulation
    const txWithMaxCU = await transaction
      .prepend(setComputeUnitPrice(umi, { microLamports: priorityFee }))
      .prepend(setComputeUnitLimit(umi, { units: 1_400_000 }))
      .setLatestBlockhash(umi);

    const built = await txWithMaxCU.buildWithLatestBlockhash(umi);

    // Simulate to get actual CU needed
    const requiredUnits = await getRequiredCU(umi, built);
    console.log(`Using compute units: ${requiredUnits}`);

    // Build final transaction with optimized values
    return transaction
      .prepend(setComputeUnitPrice(umi, { microLamports: priorityFee }))
      .prepend(setComputeUnitLimit(umi, { units: requiredUnits }));
  } catch (error) {
    console.warn("Transaction optimization failed, using defaults:", error);
    // Apply sensible defaults if optimization fails
    return transaction
      .prepend(setComputeUnitPrice(umi, { microLamports: 1000 }))
      .prepend(setComputeUnitLimit(umi, { units: 200_000 }));
  }
};
