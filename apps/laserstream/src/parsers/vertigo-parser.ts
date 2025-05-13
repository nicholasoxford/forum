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
