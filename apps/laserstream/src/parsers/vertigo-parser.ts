import { BorshInstructionCoder } from "@coral-xyz/anchor";
import ammIdl from "@vertigo-amm/vertigo-sdk/dist/target/idl/amm.json";
import { Amm } from "@vertigo-amm/vertigo-sdk/dist/target/types/amm";

// Log the buy instruction definition
console.log(
  "BUY INSTRUCTION DEFINITION:",
  (ammIdl as Amm).instructions.find((instr) => instr.name === "buy")
);

// Define the response type for Vertigo accounts
export type VertigoBuyAccountsResponse = {
  pool: string;
  user: string;
  owner: string;
  mint_a: string;
  mint_b: string;
  user_ta_a: string;
  user_ta_b: string;
  vault_a: string;
  vault_b: string;
  token_program_a: string;
  token_program_b: string;
  system_program: string;
  program: string;
  params?: {
    amount: string;
    limit: string;
  };
  tokenChanges?: {
    mintA?: {
      userInput?: string;
      vaultReceived?: string;
      userBalanceChange?: string;
      uiUserBalanceChange?: string;
      decimals: number;
      uiInput?: string;
      uiReceived?: string;
      // Fields used in sell transactions
      userReceived?: string;
      vaultSent?: string;
      uiSent?: string;
    };
    mintB?: {
      userReceived?: string;
      vaultSent?: string;
      userBalanceChange?: string;
      uiUserBalanceChange?: string;
      decimals: number;
      uiReceived?: string;
      uiSent?: string;
      // Fields used in sell transactions
      userInput?: string;
      vaultReceived?: string;
      uiInput?: string;
    };
  };
};

// Define the TransactionData type directly to match the structure we're using
export const decodeVertigoInstructionData = (dataString: string) => {
  try {
    // Convert the base58 string to a Buffer
    const coder = new BorshInstructionCoder(ammIdl as Amm);
    const decoded = coder.decode(dataString, "base58");
    console.log({ decoded });
    if (!decoded) {
      return null;
    }

    let processedData = decoded.data;

    // Handle instruction parameters consistently for both buy and sell
    if (
      (decoded.name === "buy" || decoded.name === "sell") &&
      (decoded.data as any)?.params
    ) {
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
      console.log(`Decoded ${decoded.name} instruction data:`, processedData);
    }

    return { name: decoded.name, data: processedData };
  } catch (error) {
    console.error(`Error decoding Vertigo instruction data: ${error}`);
    return null;
  }
};

export const VERTIGO_PROGRAM_ID = "vrTGoBuy5rYSxAfV3jaRJWHH6nN9WK4NRExGxsk1bCJ";

export const extractVertigoAccounts = (ix: any, instructionName: string) => {
  try {
    console.log("INSTRUCTION OBJECT:", JSON.stringify(ix, null, 2));

    // Find the instruction definition in the IDL
    const instructionDef = (ammIdl as Amm).instructions.find(
      (instr) => instr.name.toLowerCase() === instructionName.toLowerCase()
    );

    if (!instructionDef) {
      console.log("No instruction definition found for:", instructionName);
      return null;
    }

    console.log(
      "INSTRUCTION DEF ACCOUNTS:",
      instructionDef.accounts.map((a) => a.name)
    );

    if (!ix || !ix.accounts) {
      console.log("No accounts array in instruction:", ix);
      return null;
    }

    // Map account indices to account names from the IDL
    const accountMap: Record<string, string> = {};

    ix.accounts.forEach((accountIndex: number, i: number) => {
      if (i < instructionDef.accounts.length) {
        const accountDef = instructionDef.accounts[i];

        if (accountDef) {
          // Convert camelCase to snake_case for consistency
          const snakeCaseName = accountDef.name.replace(
            /[A-Z]/g,
            (letter) => `_${letter.toLowerCase()}`
          );
          accountMap[snakeCaseName] = accountIndex.toString();
        }
      }
    });

    return accountMap;
  } catch (error) {
    console.error(`Error extracting accounts for ${instructionName}:`, error);
    return null;
  }
};

export const extractVertigoAccountsFromBuy = (
  txData: any,
  ix: any,
  decodedData?: any
): VertigoBuyAccountsResponse | null => {
  try {
    // We already have the accounts in order from the instruction data
    // Just map them directly to the right names
    if (!ix || !ix.accounts || !Array.isArray(ix.accounts)) {
      console.log("No valid accounts array in instruction");
      return null;
    }

    // Make sure we have all 13 accounts that we need
    if (ix.accounts.length < 13) {
      console.log(`Expected 13 accounts but got ${ix.accounts.length}`);
      return null;
    }

    // Extract the decoded parameters if provided
    const params = decodedData?.data?.params;

    // Build the account mapping
    const accountResponse: VertigoBuyAccountsResponse = {
      pool: ix.accounts[0],
      user: ix.accounts[1],
      owner: ix.accounts[2],
      mint_a: ix.accounts[3],
      mint_b: ix.accounts[4],
      user_ta_a: ix.accounts[5],
      user_ta_b: ix.accounts[6],
      vault_a: ix.accounts[7],
      vault_b: ix.accounts[8],
      token_program_a: ix.accounts[9],
      token_program_b: ix.accounts[10],
      system_program: ix.accounts[11],
      program: ix.accounts[12],
      ...(params && { params }),
    };

    // Calculate token balance changes if transaction meta is available
    const meta = txData?.transaction?.meta;
    if (meta) {
      const tokenChanges: any = {};

      // Use inner instructions to track token transfers
      if (meta.innerInstructions) {
        const innerInstructions = meta.innerInstructions.find(
          (inner: any) => inner.index === 4 // Assuming the buy instruction is always at index 4
        )?.instructions;

        if (innerInstructions) {
          // Look for token transfers in inner instructions
          for (const instruction of innerInstructions) {
            if (
              instruction?.parsed?.type === "transferChecked" &&
              instruction?.parsed?.info
            ) {
              const info = instruction.parsed.info;
              const mint = info.mint;
              const amount = info.tokenAmount.amount;
              const decimals = info.tokenAmount.decimals;
              const uiAmount = info.tokenAmount.uiAmount;

              // Check which mint this transfer is for
              if (mint === ix.accounts[3]) {
                // mint_a (input token)
                tokenChanges.mintA = {
                  userInput: amount,
                  vaultReceived: amount,
                  decimals,
                  uiInput: uiAmount.toString(),
                  uiReceived: uiAmount.toString(),
                };
              } else if (mint === ix.accounts[4]) {
                // mint_b (output token)
                tokenChanges.mintB = {
                  userReceived: amount,
                  vaultSent: amount,
                  decimals,
                  uiReceived: uiAmount.toString(),
                  uiSent: uiAmount.toString(),
                };
              }
            }
          }
        }
      }

      // Also check pre/post token balances for full picture of changes
      if (meta.preTokenBalances && meta.postTokenBalances) {
        // Create maps for easier lookup
        const preBalances: Record<string, any> = {};
        const postBalances: Record<string, any> = {};

        meta.preTokenBalances.forEach((balance: any) => {
          const key = `${balance.mint}-${balance.owner}`;
          preBalances[key] = balance;
        });

        meta.postTokenBalances.forEach((balance: any) => {
          const key = `${balance.mint}-${balance.owner}`;
          postBalances[key] = balance;
        });

        // Calculate changes for user's Mint A balance (input token)
        const userMintAKey = `${ix.accounts[3]}-${ix.accounts[1]}`; // mint_a-user
        const preMintAUser = preBalances[userMintAKey];
        const postMintAUser = postBalances[userMintAKey];

        if (preMintAUser && postMintAUser) {
          const preAmount = preMintAUser.uiTokenAmount.amount;
          const postAmount = postMintAUser.uiTokenAmount.amount;
          const decimals = preMintAUser.uiTokenAmount.decimals;
          const amountChange = (
            BigInt(postAmount) - BigInt(preAmount)
          ).toString();

          if (!tokenChanges.mintA) {
            tokenChanges.mintA = { decimals };
          }

          tokenChanges.mintA.userBalanceChange = amountChange;
          tokenChanges.mintA.uiUserBalanceChange = (
            postMintAUser.uiTokenAmount.uiAmount -
            preMintAUser.uiTokenAmount.uiAmount
          ).toString();
        }

        // Calculate changes for user's Mint B balance (output token)
        const userMintBKey = `${ix.accounts[4]}-${ix.accounts[1]}`; // mint_b-user
        const preMintBUser = preBalances[userMintBKey];
        const postMintBUser = postBalances[userMintBKey];

        if (preMintBUser && postMintBUser) {
          const preAmount = preMintBUser.uiTokenAmount.amount;
          const postAmount = postMintBUser.uiTokenAmount.amount;
          const decimals = preMintBUser.uiTokenAmount.decimals;
          const amountChange = (
            BigInt(postAmount) - BigInt(preAmount)
          ).toString();

          if (!tokenChanges.mintB) {
            tokenChanges.mintB = { decimals };
          }

          tokenChanges.mintB.userBalanceChange = amountChange;
          tokenChanges.mintB.uiUserBalanceChange = (
            postMintBUser.uiTokenAmount.uiAmount -
            preMintBUser.uiTokenAmount.uiAmount
          ).toString();
        }
      }

      // If we found token changes, add them to the response
      if (Object.keys(tokenChanges).length > 0) {
        accountResponse.tokenChanges = tokenChanges;
      }
    }

    return accountResponse;
  } catch (error) {
    console.error(`Error extracting buy accounts: ${error}`);
    return null;
  }
};

/**
 * Extract Vertigo accounts with full public keys from transaction data
 */
export const extractVertigoAccountsWithKeys = (
  txData: any,
  ix: any,
  instructionName: string
) => {
  try {
    // Find the instruction definition in the IDL
    const instructionDef = (ammIdl as Amm).instructions.find(
      (instr) => instr.name.toLowerCase() === instructionName.toLowerCase()
    );

    if (!instructionDef) {
      console.log("No instruction definition found for:", instructionName);
      return null;
    }

    if (!ix || !ix.accounts) {
      console.log("No accounts array in instruction:", ix);
      return null;
    }

    console.log(
      `Processing ${instructionName} instruction accounts:`,
      ix.accounts
    );

    // Map account names to their public keys directly
    const accountMap: Record<string, string> = {};

    // Check if we have the right number of accounts
    if (ix.accounts.length < instructionDef.accounts.length) {
      console.log(
        `Warning: Expected ${instructionDef.accounts.length} accounts but got ${ix.accounts.length}`
      );
    }

    // Map accounts directly using their position
    for (
      let i = 0;
      i < Math.min(ix.accounts.length, instructionDef.accounts.length);
      i++
    ) {
      const accountDef = instructionDef.accounts[i];
      const pubkey = ix.accounts[i];

      if (accountDef && pubkey) {
        // Add both camelCase and snake_case versions for compatibility
        const camelCaseName = accountDef.name;
        const snakeCaseName = accountDef.name.replace(
          /[A-Z]/g,
          (letter) => `_${letter.toLowerCase()}`
        );

        accountMap[camelCaseName] = pubkey;
        accountMap[snakeCaseName] = pubkey;
      }
    }

    console.log(
      "Extracted account map for " + instructionName + ":",
      JSON.stringify(accountMap, null, 2)
    );
    return accountMap;
  } catch (error) {
    console.error(
      `Error extracting accounts with keys for ${instructionName}:`,
      error
    );
    return null;
  }
};

/**
 * Extract Vertigo accounts for sell instructions, similar to buy but with specific handling for sell
 */
export const extractVertigoAccountsFromSell = (
  txData: any,
  ix: any,
  decodedData?: any
): VertigoBuyAccountsResponse | null => {
  try {
    console.log("Using fallback extraction method for sell instruction");

    // Check if we have valid accounts in the instruction
    if (!ix || !ix.accounts || !Array.isArray(ix.accounts)) {
      console.log("No valid accounts array in instruction");
      return null;
    }

    // Log what we have
    console.log("Instruction accounts:", ix.accounts);
    console.log("Instruction program ID:", ix.programId);

    // Make sure we have sufficient accounts (accounts needed for a sell instruction)
    if (ix.accounts.length < 10) {
      console.log(
        `Expected at least 10 accounts but got ${ix.accounts.length}`
      );
      return null;
    }

    // Extract the decoded parameters if provided
    const params = decodedData?.data?.params;
    console.log(
      "Decoded parameters:",
      params ? JSON.stringify(params) : "none"
    );

    // Get the sell amount directly from the parameters
    const sellAmount = params?.amount ? params.amount.toString() : "0";
    console.log("Sell amount from parameters:", sellAmount);

    // Direct mapping without using account keys from transaction
    // This assumes the accounts are in the fixed order for a sell instruction
    const accountResponse: VertigoBuyAccountsResponse = {
      pool: ix.accounts[0] || "",
      user: ix.accounts[1] || "",
      owner: ix.accounts[2] || "",
      mint_a: ix.accounts[3] || "",
      mint_b: ix.accounts[4] || "",
      user_ta_a: ix.accounts[5] || "",
      user_ta_b: ix.accounts[6] || "",
      vault_a: ix.accounts[7] || "",
      vault_b: ix.accounts[8] || "",
      token_program_a: ix.accounts[9] || "",
      token_program_b: ix.accounts[10] || "",
      system_program: ix.accounts[11] || "",
      program: ix.programId || VERTIGO_PROGRAM_ID,
      ...(params && { params }),
    };

    // Calculate token balance changes if transaction meta is available
    const meta = txData?.transaction?.meta;
    if (meta) {
      const tokenChanges: any = {};

      // Directly use the instruction parameter for input amount
      if (sellAmount && sellAmount !== "0") {
        const mintB = accountResponse.mint_b;
        // Get token info like decimals if possible
        let mintBDecimals = 6; // Default to 6 for most tokens

        if (meta.preTokenBalances) {
          const mintBBalance = meta.preTokenBalances.find(
            (b: any) => b.mint === mintB
          );
          if (mintBBalance) {
            mintBDecimals = mintBBalance.uiTokenAmount.decimals;
          }
        }

        tokenChanges.mintB = {
          userInput: sellAmount,
          vaultReceived: sellAmount,
          decimals: mintBDecimals,
          uiInput: (
            Number(sellAmount) / Math.pow(10, mintBDecimals)
          ).toString(),
          uiReceived: (
            Number(sellAmount) / Math.pow(10, mintBDecimals)
          ).toString(),
        };

        console.log(
          `Setting mintB input from params: ${sellAmount} (${tokenChanges.mintB.uiInput})`
        );
      }

      // First try to get token changes from inner instructions
      if (meta.innerInstructions && meta.innerInstructions.length > 0) {
        // Log all inner instruction indices for debugging
        const innerIndices = meta.innerInstructions.map(
          (inner: any) => inner.index
        );
        console.log("Available inner instruction indices:", innerIndices);

        // Check all inner instructions, don't assume a specific index
        for (const innerInstructionSet of meta.innerInstructions) {
          console.log(
            `Checking inner instructions at index ${innerInstructionSet.index}`
          );

          if (innerInstructionSet.instructions) {
            for (const instruction of innerInstructionSet.instructions) {
              if (
                instruction?.parsed?.type === "transferChecked" &&
                instruction?.parsed?.info
              ) {
                const info = instruction.parsed.info;
                const mint = info.mint;
                const amount = info.tokenAmount.amount;
                const decimals = info.tokenAmount.decimals;
                const uiAmount = info.tokenAmount.uiAmount;
                const source = info.source;
                const destination = info.destination;

                console.log(
                  `Found transfer: ${mint}, amount: ${amount}, from: ${source.substring(0, 8)}... to: ${destination.substring(0, 8)}...`
                );

                // Check which mint this transfer is for
                if (mint === accountResponse.mint_b) {
                  // Check if this is the user sending tokens to the vault
                  if (source === accountResponse.user_ta_b) {
                    console.log(`Found mintB transfer from user: ${amount}`);
                    // User sending tokens = input for sell
                    tokenChanges.mintB = tokenChanges.mintB || { decimals };
                    tokenChanges.mintB.userInput = amount;
                    tokenChanges.mintB.vaultReceived = amount;
                    tokenChanges.mintB.uiInput = uiAmount.toString();
                    tokenChanges.mintB.uiReceived = uiAmount.toString();
                  }
                } else if (mint === accountResponse.mint_a) {
                  // Check if this is the vault sending tokens to the user
                  if (destination === accountResponse.user_ta_a) {
                    console.log(`Found mintA transfer to user: ${amount}`);
                    // User receiving tokens = output for sell
                    tokenChanges.mintA = tokenChanges.mintA || { decimals };
                    tokenChanges.mintA.userReceived = amount;
                    tokenChanges.mintA.vaultSent = amount;
                    tokenChanges.mintA.uiReceived = uiAmount.toString();
                    tokenChanges.mintA.uiSent = uiAmount.toString();
                  }
                }
              }
            }
          }
        }
      }

      // Also check pre/post token balances for full picture of changes
      if (meta.preTokenBalances && meta.postTokenBalances) {
        // Create maps for easier lookup
        const preBalances: Record<string, any> = {};
        const postBalances: Record<string, any> = {};

        meta.preTokenBalances.forEach((balance: any) => {
          const key = `${balance.mint}-${balance.owner}`;
          preBalances[key] = balance;
        });

        meta.postTokenBalances.forEach((balance: any) => {
          const key = `${balance.mint}-${balance.owner}`;
          postBalances[key] = balance;
        });

        console.log("Token balances:", {
          pre: Object.keys(preBalances).length,
          post: Object.keys(postBalances).length,
        });

        // Log all available balance keys for debugging
        console.log("Available pre balance keys:", Object.keys(preBalances));

        // Calculate changes for user's Mint B balance (input token for sell)
        const userMintBKey = `${accountResponse.mint_b}-${accountResponse.user}`;
        const preMintBUser = preBalances[userMintBKey];
        const postMintBUser = postBalances[userMintBKey];

        if (preMintBUser && postMintBUser) {
          const preAmount = preMintBUser.uiTokenAmount.amount;
          const postAmount = postMintBUser.uiTokenAmount.amount;
          const decimals = preMintBUser.uiTokenAmount.decimals;
          const amountChange = (
            BigInt(postAmount) - BigInt(preAmount)
          ).toString();

          if (!tokenChanges.mintB) {
            tokenChanges.mintB = { decimals };
          }

          tokenChanges.mintB.userBalanceChange = amountChange;
          tokenChanges.mintB.uiUserBalanceChange = (
            postMintBUser.uiTokenAmount.uiAmount -
            preMintBUser.uiTokenAmount.uiAmount
          ).toString();

          // If we still don't have userInput, use the absolute balance change
          if (!tokenChanges.mintB.userInput && amountChange.startsWith("-")) {
            const absChange = amountChange.substring(1);
            tokenChanges.mintB.userInput = absChange;
            tokenChanges.mintB.vaultReceived = absChange;
            tokenChanges.mintB.uiInput = Math.abs(
              Number(tokenChanges.mintB.uiUserBalanceChange)
            ).toString();
            tokenChanges.mintB.uiReceived = tokenChanges.mintB.uiInput;
          }

          console.log(
            `Mint B balance change: ${amountChange} (${tokenChanges.mintB.uiUserBalanceChange})`
          );
        }

        // Calculate changes for user's Mint A balance (output token for sell)
        const userMintAKey = `${accountResponse.mint_a}-${accountResponse.user}`;
        const preMintAUser = preBalances[userMintAKey];
        const postMintAUser = postBalances[userMintAKey];

        if (preMintAUser && postMintAUser) {
          const preAmount = preMintAUser.uiTokenAmount.amount;
          const postAmount = postMintAUser.uiTokenAmount.amount;
          const decimals = preMintAUser.uiTokenAmount.decimals;
          const amountChange = (
            BigInt(postAmount) - BigInt(preAmount)
          ).toString();

          if (!tokenChanges.mintA) {
            tokenChanges.mintA = { decimals };
          }

          tokenChanges.mintA.userBalanceChange = amountChange;
          tokenChanges.mintA.uiUserBalanceChange = (
            postMintAUser.uiTokenAmount.uiAmount -
            preMintAUser.uiTokenAmount.uiAmount
          ).toString();

          // If we still don't have userReceived, use the positive balance change
          if (
            !tokenChanges.mintA.userReceived &&
            amountChange.startsWith("-") === false
          ) {
            tokenChanges.mintA.userReceived = amountChange;
            tokenChanges.mintA.vaultSent = amountChange;
            tokenChanges.mintA.uiReceived =
              tokenChanges.mintA.uiUserBalanceChange;
            tokenChanges.mintA.uiSent = tokenChanges.mintA.uiReceived;
          }

          console.log(
            `Mint A balance change: ${amountChange} (${tokenChanges.mintA.uiUserBalanceChange})`
          );
        }
      }

      // If we found token changes, add them to the response
      if (Object.keys(tokenChanges).length > 0) {
        console.log("Token changes for sell:", JSON.stringify(tokenChanges));
        accountResponse.tokenChanges = tokenChanges;
      }
    }

    console.log(
      "Extracted sell accounts (fallback):",
      JSON.stringify(accountResponse, null, 2)
    );
    return accountResponse;
  } catch (error) {
    console.error(`Error extracting sell accounts: ${error}`);
    return null;
  }
};
