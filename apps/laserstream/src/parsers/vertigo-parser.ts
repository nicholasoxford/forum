import { BorshInstructionCoder } from "@coral-xyz/anchor";
import ammIdl from "@vertigo-amm/vertigo-sdk/dist/target/idl/amm.json";
import { Amm } from "@vertigo-amm/vertigo-sdk/dist/target/types/amm";
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

    // Handle buy instruction specially
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
          accountMap[accountDef.name] = accountIndex.toString();
        }
      }
    });

    return accountMap;
  } catch (error) {
    console.error(`Error extracting accounts for ${instructionName}:`, error);
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

    // Ensure we have account keys in the transaction data
    if (!txData?.transaction?.transaction?.message?.accountKeys) {
      console.log("No account keys found in transaction");
      return null;
    }

    // Map account indices directly to pubkeys using IDL account names
    const accountMap: Record<string, string> = {};

    ix.accounts.forEach((accountIndex: number, i: number) => {
      if (i < instructionDef.accounts.length) {
        const accountDef = instructionDef.accounts[i];
        const accountKey =
          txData.transaction.transaction.message.accountKeys[accountIndex];

        if (accountDef && accountKey) {
          accountMap[accountDef.name] = accountKey.pubkey;
        }
      }
    });

    return accountMap;
  } catch (error) {
    console.error(
      `Error extracting accounts with keys for ${instructionName}:`,
      error
    );
    return null;
  }
};
