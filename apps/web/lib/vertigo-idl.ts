import fs from "fs";
import path from "path";

// Function to load IDL files
export function loadIdlFiles() {
  try {
    // Get the absolute path to the idl directory
    const idlDir = path.join(process.cwd(), "idl");
    console.log("IDL directory:", idlDir);

    // Read the IDL files
    const ammIdlPath = path.join(idlDir, "amm.json");
    const token2022IdlPath = path.join(idlDir, "token_2022_factory.json");
    const splTokenIdlPath = path.join(idlDir, "spl_token_factory.json");

    console.log("AMM IDL path:", ammIdlPath);
    console.log("Token2022 IDL path:", token2022IdlPath);
    console.log("SPL Token IDL path:", splTokenIdlPath);

    // Check if the files exist
    if (!fs.existsSync(ammIdlPath)) {
      throw new Error(`AMM IDL file not found at ${ammIdlPath}`);
    }
    if (!fs.existsSync(token2022IdlPath)) {
      throw new Error(`Token2022 IDL file not found at ${token2022IdlPath}`);
    }
    if (!fs.existsSync(splTokenIdlPath)) {
      throw new Error(`SPL Token IDL file not found at ${splTokenIdlPath}`);
    }

    // Read the IDL files
    const ammIdl = JSON.parse(fs.readFileSync(ammIdlPath, "utf8"));
    const token2022Idl = JSON.parse(fs.readFileSync(token2022IdlPath, "utf8"));
    const splTokenIdl = JSON.parse(fs.readFileSync(splTokenIdlPath, "utf8"));

    return {
      ammIdl,
      token2022Idl,
      splTokenIdl,
      ammIdlPath,
      token2022IdlPath,
      splTokenIdlPath,
    };
  } catch (error) {
    console.error("Error loading IDL files:", error);
    throw error;
  }
}

// Import the IDL files directly
// This approach works in Next.js API routes
import ammIdl from "../idl/amm.json";
import token2022Idl from "../idl/token_2022_factory.json";
import splTokenIdl from "../idl/spl_token_factory.json";

export { ammIdl, token2022Idl, splTokenIdl };
