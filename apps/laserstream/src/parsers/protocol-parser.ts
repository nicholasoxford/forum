import { PublicKey } from "@solana/web3.js";
import {
  BorshCoder,
  BorshInstructionCoder,
  EventParser,
  Idl,
} from "@coral-xyz/anchor";
import { PumpIDL } from "../idl/pump-idl";
import { logError, logEvent, logWarning, log } from "../utils/logger";
import ammIdl from "@vertigo-amm/vertigo-sdk/dist/target/idl/amm.json";
import { Amm } from "@vertigo-amm/vertigo-sdk/dist/target/types/amm";

// Define a common transaction data interface for improved type safety
export interface TransactionData {
  signature: string;
  slot?: number;
  transaction?: {
    message?: {
      accountKeys?: Array<{
        pubkey: string;
        signer?: boolean;
        writable?: boolean;
      }>;
      instructions?: Array<{
        programId: string;
        accounts?: number[];
        parsed?: {
          type: string;
          info: Record<string, any>;
        };
      }>;
    };
    meta?: {
      err?: any;
      logMessages?: string[];
      innerInstructions?: Array<{
        instructions: any[];
      }>;
      preTokenBalances?: any[];
      postTokenBalances?: any[];
    };
  };
  meta?: {
    err?: any;
    logMessages?: string[];
  };
}

// Program IDs
export const PUMP_PROGRAM_ID = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
export const VERTIGO_PROGRAM_ID = "vrTGoBuy5rYSxAfV3jaRJWHH6nN9WK4NRExGxsk1bCJ";
export const GRAPH_PROGRAM_ID = "GraphUyqhPmEAckWzi7zAvbvUTXf8kqX7JtuvdGYRDRh";

const coder = new BorshInstructionCoder(ammIdl as Amm);

// ==================== TRANSACTION VALIDATION FUNCTIONS ====================

/**
 * Check if transaction is from the Pump program
 */
export const isPumpTransaction = (txData: TransactionData): boolean => {
  // Primary check - does the transaction contain an instruction calling the pump program?
  const hasInnerPumpInstruction =
    txData.transaction?.meta?.innerInstructions?.some((inner: any) =>
      inner.instructions.some((ix: any) => ix.programId === PUMP_PROGRAM_ID)
    ) || false;

  if (hasInnerPumpInstruction) {
    return true;
  }

  // Secondary checks (fallbacks)
  // Check account keys
  const accountsMatch =
    txData.transaction?.message?.accountKeys?.some(
      (key: any) => key.pubkey === PUMP_PROGRAM_ID
    ) || false;

  // Check program invocation in logs
  const logsMatch =
    txData.meta?.logMessages?.some((msg: string) =>
      msg.includes(`Program ${PUMP_PROGRAM_ID} invoke`)
    ) || false;

  return accountsMatch || logsMatch;
};

/**
 * Check if transaction is from the Vertigo program
 */
export const isVertigoTransaction = (txData: TransactionData): boolean => {
  // Primary check - does the transaction contain an instruction calling the vertigo program?
  const hasInnerVertigoInstruction =
    txData.transaction?.meta?.innerInstructions?.some((inner: any) =>
      inner.instructions.some((ix: any) => ix.programId === VERTIGO_PROGRAM_ID)
    ) || false;

  if (hasInnerVertigoInstruction) {
    return true;
  }

  // Secondary checks (fallbacks)
  // Check account keys
  const accountsMatch =
    txData.transaction?.message?.accountKeys?.some(
      (key: any) => key.pubkey === VERTIGO_PROGRAM_ID
    ) || false;

  // Check program invocation in logs
  const logsMatch =
    txData.meta?.logMessages?.some((msg: string) =>
      msg.includes(`Program ${VERTIGO_PROGRAM_ID} invoke`)
    ) || false;

  return accountsMatch || logsMatch;
};

/**
 * Check if transaction is from the Graph program
 */
export const isGraphTransaction = (txData: TransactionData): boolean => {
  // Check for program invocation in logs
  const logsMatch =
    txData.transaction?.meta?.logMessages?.some((msg: string) =>
      msg.includes(`Program ${GRAPH_PROGRAM_ID} invoke`)
    ) || false;

  // Check account keys
  const accountsMatch =
    txData.transaction?.message?.accountKeys?.some(
      (key: any) => key.pubkey === GRAPH_PROGRAM_ID
    ) || false;
  return logsMatch || accountsMatch;
};

// ==================== INSTRUCTION DETECTION FUNCTIONS ====================

/**
 * Parse instruction type from transaction logs
 */
export const getInstructionType = (txData: TransactionData): string | null => {
  if (!txData || !txData.transaction?.meta?.logMessages) return null;

  // Look for specific instruction types
  for (const msg of txData.transaction.meta.logMessages) {
    // Check for different instruction types
    if (msg.includes("Program log: Instruction: Create")) return "Create";
    if (msg.includes("Program log: Instruction: Buy")) return "Buy";
    if (msg.includes("Program log: Instruction: Sell")) return "Sell";
    if (msg.includes("Program log: Instruction: Withdraw")) return "Withdraw";
    if (msg.includes("Program log: Instruction: Initialize"))
      return "Initialize";
    if (msg.includes("Program log: Instruction: SetParams")) return "SetParams";
  }

  // If we couldn't find a specific instruction type but the program was invoked,
  if (txData.transaction.meta.logMessages) {
    for (const msg of txData.transaction.meta.logMessages) {
      if (msg.includes("Program log: CreateEvent")) return "Create";
      if (msg.includes("Program log: TradeEvent")) {
        // Try to determine if it's a buy or sell from the event data
        if (msg.includes('"isBuy":true') || msg.includes('"isBuy": true'))
          return "Buy";
        if (msg.includes('"isBuy":false') || msg.includes('"isBuy": false'))
          return "Sell";
        return "Trade"; // Generic trade if we can't determine buy/sell
      }
      if (msg.includes("Program log: CompleteEvent")) return "Withdraw";
      if (msg.includes("Program log: SetParamsEvent")) return "SetParams";
    }
  }

  return "Unknown"; // Return Unknown instead of null for better logging
};

/**
 * Extract operation type from transaction logs for GraphU program
 */
export const getGraphOperationType = (data: any): string => {
  // Check log messages if available
  if (data.transaction?.meta?.logMessages) {
    for (const message of data.transaction.meta.logMessages) {
      // Check for various ways the operation might be identified
      if (message.includes("CreateNode")) return "CREATE_NODE";
      if (message.includes("CreateEdge")) return "CREATE_EDGE";
      if (message.includes("UpdateNode")) return "UPDATE_NODE";
      if (message.includes("UpdateEdge")) return "UPDATE_EDGE";
      if (message.includes("DeleteNode")) return "DELETE_NODE";
      if (message.includes("DeleteEdge")) return "DELETE_EDGE";
    }
  }

  // If no instruction type found in logs, check for Graph program operations
  if (isGraphTransaction(data)) {
    return "GRAPH_PROGRAM_OPERATION";
  }

  return "Unknown Operation";
};

// ==================== EVENT PARSING FUNCTIONS ====================

/**
 * Helper function to parse events using Anchor's event parser
 */
export const parseAnchorEvents = (txData: TransactionData) => {
  try {
    if (!txData.transaction?.meta?.logMessages) {
      return null;
    }
    const logs = txData.transaction.meta.logMessages;
    // Parse events from the log messages - this returns a generator
    //@ts-ignore
    const eventsGenerator = pumpParser.parseLogs(logs);

    // Convert generator to array
    const events: any[] = [];
    for (const event of eventsGenerator) {
      events.push({
        name: event.name,
        data: event.data,
      });
    }

    if (events.length === 0) {
      return null;
    }

    // Process each event type
    const processedEvents = events.map((event) => {
      switch (event.name) {
        case "CreateEvent":
          return {
            type: "CreateEvent",
            data: processCreateEvent(event),
          };
        case "TradeEvent":
          return {
            type: "TradeEvent",
            data: processTradeEvent(event),
          };
        case "CompleteEvent":
          return {
            type: "CompleteEvent",
            data: processCompleteEvent(event),
          };
        default:
          return {
            type: event.name,
            data: event.data,
          };
      }
    });

    return processedEvents;
  } catch (error) {
    logError(`Error parsing Anchor events: ${error}`);
    return null;
  }
};

// ==================== EVENT PROCESSING FUNCTIONS ====================

/**
 * Process CreateEvent data into a more readable format
 */
export const processCreateEvent = (event: any) => {
  if (!event || !event.data) return null;

  try {
    return {
      name: event.data.name,
      symbol: event.data.symbol,
      uri: event.data.uri,
      mint: event.data.mint?.toString(),
      bondingCurve: event.data.bondingCurve?.toString(),
      user: event.data.user?.toString(),
    };
  } catch (error) {
    logError(`Error processing CreateEvent: ${error}`);
    return null;
  }
};

/**
 * Process TradeEvent data into a more readable format
 */
export const processTradeEvent = (event: any) => {
  if (!event || !event.data) return null;

  try {
    return {
      mint: event.data.mint?.toString(),
      solAmount: event.data.solAmount?.toString(),
      tokenAmount: event.data.tokenAmount?.toString(),
      isBuy: event.data.isBuy,
      user: event.data.user?.toString(),
      timestamp: event.data.timestamp?.toString(),
      virtualSolReserves: event.data.virtualSolReserves?.toString(),
      virtualTokenReserves: event.data.virtualTokenReserves?.toString(),
      realSolReserves: event.data.realSolReserves?.toString(),
      realTokenReserves: event.data.realTokenReserves?.toString(),
    };
  } catch (error) {
    logError(`Error processing TradeEvent: ${error}`);
    return null;
  }
};

/**
 * Process CompleteEvent data into a more readable format
 */
export const processCompleteEvent = (event: any) => {
  if (!event || !event.data) return null;

  try {
    return {
      user: event.data.user?.toString(),
      mint: event.data.mint?.toString(),
      bondingCurve: event.data.bondingCurve?.toString(),
      timestamp: event.data.timestamp?.toString(),
    };
  } catch (error) {
    logError(`Error processing CompleteEvent: ${error}`);
    return null;
  }
};

// ==================== TRANSACTION DATA EXTRACTION FUNCTIONS ====================

/**
 * Extract accounts involved in a transaction
 */
export const extractAccounts = (txData: any, instructionName: string) => {
  try {
    // Find the instruction in the IDL
    const instructionDef = PumpIDL.instructions.find(
      (instr) => instr.name.toLowerCase() === instructionName.toLowerCase()
    );

    if (!instructionDef || !txData.transaction?.message?.instructions) {
      return null;
    }

    // Find the instruction that matches our program ID
    const pumpInstruction = txData.transaction.message.instructions.find(
      (ix: any) => ix.programId === PUMP_PROGRAM_ID
    );

    if (!pumpInstruction || !pumpInstruction.accounts) {
      return null;
    }

    // Map account indices to account keys and names from the IDL
    const accountMap: Record<string, string> = {};

    pumpInstruction.accounts.forEach((accountIndex: number, i: number) => {
      if (
        i < instructionDef.accounts.length &&
        accountIndex < txData.transaction.message.accountKeys.length
      ) {
        const accountDef = instructionDef.accounts[i];
        const accountKey = txData.transaction.message.accountKeys[accountIndex];

        if (accountDef && accountKey) {
          accountMap[accountDef.name] = accountKey.pubkey;
        }
      }
    });

    return accountMap;
  } catch (error) {
    logError(`Error extracting accounts for ${instructionName}: ${error}`);
    return null;
  }
};

/**
 * Extract accounts involved in a Graph transaction
 */
export const extractGraphAccounts = (txData: any) => {
  try {
    const accounts: Record<string, string> = {};

    if (txData?.transaction?.message?.accountKeys) {
      txData.transaction.message.accountKeys.forEach(
        (account: any, index: number) => {
          // Store account pubkey with its index for easy reference
          accounts[`account_${index}`] = account.pubkey;

          // Special account names based on common patterns
          if (index === 0) accounts["feePayer"] = account.pubkey;
        }
      );
    }

    return accounts;
  } catch (error) {
    logError(`Error extracting Graph accounts: ${error}`);
    return {};
  }
};

/**
 * Advanced helper to extract token transfers from transaction
 */
export const extractTokenTransfers = (txData: any) => {
  try {
    const transfers: any[] = [];

    // Check inner instructions for token transfers
    if (txData.meta?.innerInstructions) {
      txData.meta.innerInstructions.forEach((inner: any) => {
        if (inner.instructions) {
          inner.instructions.forEach((ix: any) => {
            // Check if this is a token transfer instruction
            if (
              ix.programId === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" &&
              ix.parsed?.type === "transfer"
            ) {
              transfers.push({
                source: ix.parsed.info.source,
                destination: ix.parsed.info.destination,
                amount: ix.parsed.info.amount,
                authority: ix.parsed.info.authority,
              });
            }
          });
        }
      });
    }

    return transfers.length > 0 ? transfers : null;
  } catch (error) {
    logError(`Error extracting token transfers: ${error}`);
    return null;
  }
};

/**
 * Extract SOL transfers from transaction
 */
export const extractSolTransfers = (txData: any) => {
  try {
    const transfers: any[] = [];

    // Check both main instructions and inner instructions for SOL transfers
    const checkInstructions = (instructions: any[]) => {
      instructions.forEach((ix: any) => {
        if (
          ix.programId === "So11111111111111111111111111111111111111112" &&
          ix.parsed?.type === "transfer"
        ) {
          transfers.push({
            source: ix.parsed.info.source,
            destination: ix.parsed.info.destination,
            lamports: ix.parsed.info.lamports,
          });
        }
      });
    };

    // Check main instructions
    if (txData.transaction?.message?.instructions) {
      checkInstructions(txData.transaction.message.instructions);
    }

    // Check inner instructions
    if (txData.meta?.innerInstructions) {
      txData.meta.innerInstructions.forEach((inner: any) => {
        if (inner.instructions) {
          checkInstructions(inner.instructions);
        }
      });
    }

    return transfers.length > 0 ? transfers : null;
  } catch (error) {
    logError(`Error extracting SOL transfers: ${error}`);
    return null;
  }
};

/**
 * Extract token balances before and after the transaction
 */
export const extractTokenBalanceChanges = (txData: any) => {
  try {
    const balanceChanges: any[] = [];

    if (txData.meta?.preTokenBalances && txData.meta?.postTokenBalances) {
      // Create a map of pre-balances for easy lookup
      const preBalances: Record<string, any> = {};
      txData.meta.preTokenBalances.forEach((balance: any) => {
        const key = `${balance.accountIndex}-${balance.mint}`;
        preBalances[key] = balance;
      });

      // Compare with post-balances to detect changes
      txData.meta.postTokenBalances.forEach((postBalance: any) => {
        const key = `${postBalance.accountIndex}-${postBalance.mint}`;
        const preBalance = preBalances[key];

        // If there was a pre-balance, calculate the change
        if (preBalance) {
          const preAmount = BigInt(preBalance.uiTokenAmount.amount);
          const postAmount = BigInt(postBalance.uiTokenAmount.amount);
          const change = postAmount - preAmount;

          if (change !== BigInt(0)) {
            balanceChanges.push({
              account:
                txData.transaction.message.accountKeys[postBalance.accountIndex]
                  .pubkey,
              mint: postBalance.mint,
              owner: postBalance.owner,
              preAmount: preBalance.uiTokenAmount.uiAmount,
              postAmount: postBalance.uiTokenAmount.uiAmount,
              change: change.toString(),
              decimals: postBalance.uiTokenAmount.decimals,
            });
          }
        }
        // If there was no pre-balance but there is a post-balance, it's a new token account
        else {
          balanceChanges.push({
            account:
              txData.transaction.message.accountKeys[postBalance.accountIndex]
                .pubkey,
            mint: postBalance.mint,
            owner: postBalance.owner,
            preAmount: 0,
            postAmount: postBalance.uiTokenAmount.uiAmount,
            change: postBalance.uiTokenAmount.amount,
            decimals: postBalance.uiTokenAmount.decimals,
          });
        }
      });

      // Check for token accounts that were closed/emptied
      txData.meta.preTokenBalances.forEach((preBalance: any) => {
        const key = `${preBalance.accountIndex}-${preBalance.mint}`;
        const postBalance = txData.meta.postTokenBalances.find(
          (post: any) =>
            post.accountIndex === preBalance.accountIndex &&
            post.mint === preBalance.mint
        );

        // If there was no post-balance, the account was closed
        if (
          !postBalance &&
          BigInt(preBalance.uiTokenAmount.amount) > BigInt(0)
        ) {
          balanceChanges.push({
            account:
              txData.transaction.message.accountKeys[preBalance.accountIndex]
                .pubkey,
            mint: preBalance.mint,
            owner: preBalance.owner,
            preAmount: preBalance.uiTokenAmount.uiAmount,
            postAmount: 0,
            change: `-${preBalance.uiTokenAmount.amount}`,
            decimals: preBalance.uiTokenAmount.decimals,
          });
        }
      });
    }

    return balanceChanges.length > 0 ? balanceChanges : null;
  } catch (error) {
    logError(`Error extracting token balance changes: ${error}`);
    return null;
  }
};

// ==================== TRANSACTION PROCESSING FUNCTIONS ====================

/**
 * Process transaction with improved error handling
 */
export const processTransaction = (
  txData: TransactionData,
  isProgramMuted?: (programId: string) => boolean
) => {
  // Check if this is a Pump transaction
  if (!isPumpTransaction(txData)) {
    return null;
  }

  // Skip transactions from muted programs completely
  if (isProgramMuted && isProgramMuted(PUMP_PROGRAM_ID)) {
    return null;
  }

  // Skip failed transactions
  if (txData.transaction?.meta?.err) {
    logWarning(`Skipping failed transaction: ${txData.signature}`);
    return null;
  }

  // Determine the instruction type
  const instructionType = getInstructionType(txData);

  // Skip Initialize transactions completely - don't even log them
  if (instructionType === "Initialize" || instructionType === "SetParams") {
    return null;
  }

  // Get the transaction signature for logging
  const signature = txData.signature;
  const shortSig = signature.slice(0, 10) + "..." + signature.slice(-4);

  // Log transaction signature in a compact format
  log(`Transaction: ${shortSig}`, "info");

  // Parse based on instruction type
  let parsedEvent = null;
  switch (instructionType) {
    case "Create":
      parsedEvent = parseCreateEvent(txData);
      break;
    case "Buy":
      parsedEvent = parseBuyEvent(txData);
      break;
    case "Sell":
      parsedEvent = parseSellEvent(txData);
      break;
    case "Withdraw":
      parsedEvent = parseWithdrawEvent(txData);
      break;
    case "Trade":
      // Handle generic trade event
      const events = parseAnchorEvents(txData);
      if (events) {
        events
          .filter((e) => e.type === "TradeEvent")
          .forEach((event) => {
            const data = event.data;
            const isBuy = data?.isBuy;
            const mintAddress = data?.mint;
            const shortMint = mintAddress
              ? `${mintAddress.slice(0, 6)}...${mintAddress.slice(-4)}`
              : "unknown";

            if (isBuy) {
              logEvent(
                `💰 \x1b[32mBUY\x1b[0m: Token transfer detected | Mint: ${shortMint}`
              );
            } else {
              logEvent(
                `💸 \x1b[31mSELL\x1b[0m: Token transfer detected | Mint: ${shortMint}`
              );
            }
          });
      }
      break;
    case "Unknown":
    default:
      logWarning(`Unknown instruction type in tx: ${shortSig}`);
  }

  // Add a line separator for better readability between transactions
  console.log(
    "\x1b[90m―――――――――――――――――――――――――――――――――――――――――――――――――――――――――\x1b[0m"
  );

  return parsedEvent;
};

/**
 * Parse Graph transaction data into a clean format
 */
export const parseGraphTransactionData = (data: any) => {
  try {
    const operationType = getGraphOperationType(data);
    const signature = data.signature;
    const shortSig = signature
      ? signature.slice(0, 10) + "..." + signature.slice(-4)
      : "unknown";

    logEvent(`📊 GRAPH TRANSACTION: ${shortSig}`);
    logEvent(`📝 Type: ${operationType}`);
    logEvent(`📍 Slot: ${data.slot || "unknown"}`);

    // Extract accounts involved
    const accounts = extractGraphAccounts(data);

    // Get transaction status
    const status = data.meta?.err ? "Failed" : "Success";
    logEvent(`✅ Status: ${status}`);

    // Add a line separator for better readability between transactions
    console.log(
      "\x1b[90m―――――――――――――――――――――――――――――――――――――――――――――――――――――――――\x1b[0m"
    );

    return {
      type: operationType,
      signature: data.signature,
      slot: data.slot,
      accounts,
      success: !data.meta?.err,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logError(`Error parsing Graph transaction data: ${error}`);
    return null;
  }
};

/**
 * Parse any Graph transaction based on its operation type
 */
export const parseGraphEvent = (txData: any) => {
  const operationType = getGraphOperationType(txData);

  switch (operationType) {
    case "CREATE_NODE":
      return parseCreateNodeEvent(txData);
    case "CREATE_EDGE":
      return parseCreateEdgeEvent(txData);
    default:
      return parseGraphTransactionData(txData);
  }
};

/**
 * Parse a CreateNode transaction
 */
export const parseCreateNodeEvent = (txData: any) => {
  try {
    // Check if this is a CreateNode transaction
    if (getGraphOperationType(txData) !== "CREATE_NODE") {
      return null;
    }

    // Extract accounts involved
    const accounts = extractGraphAccounts(txData);

    return {
      type: "CREATE_NODE",
      signature: txData.signature,
      slot: txData.slot,
      accounts,
      success: !txData.meta?.err,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logError(`Error parsing CreateNode event: ${error}`);
    return null;
  }
};

/**
 * Parse a CreateEdge transaction
 */
export const parseCreateEdgeEvent = (txData: any) => {
  try {
    // Check if this is a CreateEdge transaction
    if (getGraphOperationType(txData) !== "CREATE_EDGE") {
      return null;
    }

    // Extract accounts involved
    const accounts = extractGraphAccounts(txData);

    return {
      type: "CREATE_EDGE",
      signature: txData.signature,
      slot: txData.slot,
      accounts,
      success: !txData.meta?.err,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logError(`Error parsing CreateEdge event: ${error}`);
    return null;
  }
};

// ==================== EVENT PARSING FUNCTIONS ====================

/**
 * Parse create event from transaction
 */
export const parseCreateEvent = (txData: any) => {
  try {
    // Already verified this is a Pump transaction in the main handler
    const isCreateTx = txData.transaction?.meta?.logMessages?.some(
      (msg: string) => msg.includes("Program log: Instruction: Create")
    );

    if (!isCreateTx) {
      return null;
    }

    // Parse anchor events
    const parsedEvents = parseAnchorEvents(txData);
    if (!parsedEvents) return null;

    // Find the CreateEvent specifically
    const createEvent = parsedEvents.find(
      (event) => event.type === "CreateEvent"
    );

    // Check if there are also TradeEvents in the same transaction
    const tradeEvents = parsedEvents.filter(
      (event) => event.type === "TradeEvent"
    );

    // Extract accounts that participated in the transaction
    const accountsMap = extractAccounts(txData, "create");

    // Log a clean summary of the create event
    if (createEvent) {
      const data = createEvent.data;
      const mintAddress = data?.mint;
      const shortMint = mintAddress
        ? `${mintAddress.slice(0, 6)}...${mintAddress.slice(-4)}`
        : "unknown";
      const message = `🌟 \x1b[35mCREATE\x1b[0m: "${data?.name}" (${data?.symbol}) by ${data?.user?.slice(0, 8)}... | Mint: ${shortMint}`;
      logEvent(message);
    }

    // Log any trade events that occurred in the same transaction
    if (tradeEvents.length > 0) {
      tradeEvents.forEach((event) => {
        const data = event.data;
        const isBuy = data?.isBuy;
        const mintAddress = data?.mint;
        const shortMint = mintAddress
          ? `${mintAddress.slice(0, 6)}...${mintAddress.slice(-4)}`
          : "unknown";

        // Format SOL and token amounts for easier reading
        const solAmount = parseInt(data?.solAmount || "0") / 1000000000; // Convert lamports to SOL
        const tokenAmount = parseInt(data?.tokenAmount || "0") / 1000000; // Assuming 6 decimals
        const shortUser = data?.user?.slice(0, 8) || "unknown";

        if (isBuy) {
          logEvent(
            `💰 \x1b[32mBUY\x1b[0m: ${tokenAmount.toFixed(2)} tokens for ${solAmount.toFixed(4)} SOL by ${shortUser}... | Mint: ${shortMint}`
          );
        } else {
          logEvent(
            `💸 \x1b[31mSELL\x1b[0m: ${tokenAmount.toFixed(2)} tokens for ${solAmount.toFixed(4)} SOL by ${shortUser}... | Mint: ${shortMint}`
          );
        }
      });
    }

    // Combine all these data sources for a comprehensive event
    const createEventData = {
      createEvent: createEvent?.data || null,
      tradeEvents: tradeEvents.map((e) => e.data) || null,
      accounts: accountsMap,
    };

    return {
      type: "Create",
      signature: txData.signature,
      slot: txData.slot,
      success: !txData.transaction?.meta?.err,
      timestamp: new Date().toISOString(),
      eventData: createEventData,
    };
  } catch (error) {
    logError(`Error parsing create event: ${error}`);
    return null;
  }
};

/**
 * Parse buy event from transaction
 */
export const parseBuyEvent = (txData: any) => {
  try {
    const isBuyTx = txData.transaction?.meta?.logMessages?.some((msg: string) =>
      msg.includes("Program log: Instruction: Buy")
    );

    if (!isBuyTx) {
      return null;
    }

    // Parse anchor events
    const parsedEvents = parseAnchorEvents(txData);
    if (!parsedEvents) return null;

    // Find the TradeEvent specifically
    const tradeEvents = parsedEvents.filter(
      (event) => event.type === "TradeEvent" && event.data?.isBuy === true
    );

    if (tradeEvents.length > 0) {
      tradeEvents.forEach((event) => {
        const data = event.data;
        // Format SOL and token amounts for easier reading
        const solAmount = parseInt(data?.solAmount || "0") / 1000000000; // Convert lamports to SOL
        const tokenAmount = parseInt(data?.tokenAmount || "0") / 1000000; // Assuming 6 decimals
        const mintAddress = data?.mint;
        // Get short versions of addresses
        const shortMint = mintAddress
          ? `${mintAddress.slice(0, 6)}...${mintAddress.slice(-4)}`
          : "unknown";
        const shortUser = data?.user
          ? `${data?.user.slice(0, 8)}...`
          : "unknown";

        const message = `💰 \x1b[32mBUY\x1b[0m: ${tokenAmount.toFixed(2)} tokens for ${solAmount.toFixed(4)} SOL by ${shortUser} | Mint: ${shortMint}`;
        logEvent(message);
      });
    }

    // Extract accounts
    const accountsMap = extractAccounts(txData, "buy");

    // Combine all data to reconstruct the event
    const buyEventData = {
      tradeEvents: tradeEvents.map((e) => e.data) || null,
      accounts: accountsMap,
      isBuy: true,
    };

    return {
      type: "Buy",
      signature: txData.signature,
      slot: txData.slot,
      success: !txData.transaction?.meta?.err,
      timestamp: new Date().toISOString(),
      eventData: buyEventData,
    };
  } catch (error) {
    logError(`Error parsing buy event: ${error}`);
    return null;
  }
};

/**
 * Parse sell event from transaction
 */
export const parseSellEvent = (txData: any) => {
  try {
    const isSellTx = txData.transaction?.meta?.logMessages?.some(
      (msg: string) => msg.includes("Program log: Instruction: Sell")
    );

    if (!isSellTx) {
      return null;
    }
    // Parse anchor events
    const parsedEvents = parseAnchorEvents(txData);
    if (!parsedEvents) return null;

    // Find the TradeEvent specifically
    const tradeEvents = parsedEvents.filter(
      (event) => event.type === "TradeEvent" && event.data?.isBuy === false
    );

    if (tradeEvents.length > 0) {
      tradeEvents.forEach((event) => {
        const data = event.data;
        // Format SOL and token amounts for easier reading
        const solAmount = parseInt(data?.solAmount || "0") / 1000000000; // Convert lamports to SOL
        const tokenAmount = parseInt(data?.tokenAmount || "0") / 1000000; // Assuming 6 decimals
        const mintAddress = data?.mint;
        // Get short versions of addresses
        const shortMint = mintAddress
          ? `${mintAddress.slice(0, 6)}...${mintAddress.slice(-4)}`
          : "unknown";
        const shortUser = data?.user
          ? `${data?.user.slice(0, 8)}...`
          : "unknown";

        const message = `💸 \x1b[31mSELL\x1b[0m: ${tokenAmount.toFixed(2)} tokens for ${solAmount.toFixed(4)} SOL by ${shortUser} | Mint: ${shortMint}`;
        logEvent(message);
      });
    }

    // Extract accounts
    const accountsMap = extractAccounts(txData, "sell");

    // Combine all data to reconstruct the event
    const sellEventData = {
      tradeEvents: tradeEvents.map((e) => e.data) || null,
      accounts: accountsMap,
      isBuy: false,
    };

    return {
      type: "Sell",
      signature: txData.signature,
      slot: txData.slot,
      success: !txData.transaction?.meta?.err,
      timestamp: new Date().toISOString(),
      eventData: sellEventData,
    };
  } catch (error) {
    logError(`Error parsing sell event: ${error}`);
    return null;
  }
};

/**
 * Parse withdraw event from transaction
 */
export const parseWithdrawEvent = (txData: any) => {
  try {
    const isWithdrawTx = txData.transaction?.meta?.logMessages?.some(
      (msg: string) => msg.includes("Program log: Instruction: Withdraw")
    );

    if (!isWithdrawTx) {
      return null;
    }

    // Parse anchor events
    const parsedEvents = parseAnchorEvents(txData);
    if (!parsedEvents) return null;

    // Find the CompleteEvent specifically
    const completeEvent = parsedEvents.find(
      (event) => event.type === "CompleteEvent"
    );

    if (completeEvent) {
      const data = completeEvent.data;
      const mintAddress = data?.mint;
      const shortMint = mintAddress
        ? `${mintAddress.slice(0, 8)}...`
        : "unknown";
      const shortUser = data?.user ? `${data?.user.slice(0, 8)}...` : "unknown";

      logEvent(
        `🏧 \x1b[33mWITHDRAW\x1b[0m: Token ${shortMint} by ${shortUser}`
      );
    }

    // Extract accounts
    const accountsMap = extractAccounts(txData, "withdraw");

    // Combine all these data sources to reconstruct the event
    const withdrawEventData = {
      completeEvent: completeEvent?.data || null,
      accounts: accountsMap,
    };

    return {
      type: "Withdraw",
      signature: txData.signature,
      slot: txData.slot,
      success: !txData.transaction?.meta?.err,
      timestamp: new Date().toISOString(),
      eventData: withdrawEventData,
    };
  } catch (error) {
    logError(`Error parsing withdraw event: ${error}`);
    return null;
  }
};
