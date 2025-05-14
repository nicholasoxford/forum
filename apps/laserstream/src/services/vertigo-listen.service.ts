import { Server } from "bun";
import {
  decodeVertigoInstructionData,
  extractVertigoAccounts,
  extractVertigoAccountsWithKeys,
  extractVertigoAccountsFromSell,
} from "../parsers/vertigo-parser";
import { log, logSuccess, logError } from "../utils/logger";
import { LaserStreamClient } from "../client";

export const VERTIGO_PROGRAM_ID = "vrTGoBuy5rYSxAfV3jaRJWHH6nN9WK4NRExGxsk1bCJ";

export type VertigoBuyEvent = {
  signature: string;
  slot: number;
  instructionData: {
    amount: string;
    limit: string;
  };
  accounts: {
    pool: string;
    user: string;
    owner: string;
    mintA: string;
    mintB: string;
    userTaA: string;
    userTaB: string;
    vaultA: string;
    vaultB?: string;
    tokenProgramA?: string;
    tokenProgramB?: string;
  };
};

export type VertigoSellEvent = {
  signature: string;
  slot: number;
  instructionData: {
    amount: string;
    limit: string;
  };
  accounts: {
    pool: string;
    user: string;
    owner: string;
    mintA: string;
    mintB: string;
    userTaA: string;
    userTaB: string;
    vaultA: string;
    vaultB?: string;
    tokenProgramA?: string;
    tokenProgramB?: string;
  };
};

export type VertigoCreatePoolEvent = {
  signature: string;
  slot: number;
  instructionData: {
    shift?: string;
    initialTokenBReserves?: string;
    feeParams?: {
      normalizationPeriod?: string;
      decay?: string;
      reference?: string;
      royaltiesBps?: string;
      privilegedSwapper?: string;
    };
  };
  accounts: {
    payer: string;
    owner: string;
    tokenWalletAuthority?: string;
    mintA: string;
    mintB: string;
    tokenWalletB?: string;
    pool: string;
    vaultA?: string;
    vaultB?: string;
  };
};

export type VertigoEventHandlers = {
  onBuy?: (event: VertigoBuyEvent) => void;
  onSell?: (event: VertigoSellEvent) => void;
  onCreatePool?: (event: VertigoCreatePoolEvent) => void;
};

export class VertigoListenService {
  private client: LaserStreamClient;
  private handlers: VertigoEventHandlers = {};
  private lastTxTime = Date.now();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor(client: LaserStreamClient) {
    this.client = client;
  }

  public registerHandlers(handlers: VertigoEventHandlers): void {
    this.handlers = { ...this.handlers, ...handlers };
  }

  public async initialize(): Promise<void> {
    try {
      // Subscribe to Vertigo transactions
      const subscriptionId = await this.client.subscribeToTransactions(
        {
          accountInclude: [VERTIGO_PROGRAM_ID],
        },
        {
          commitment: "processed",
          encoding: "jsonParsed",
          transactionDetails: "full",
          maxSupportedTransactionVersion: 0,
        }
      );

      logSuccess(`Subscribed to Vertigo with ID: ${subscriptionId}`);

      // Set up transaction handler
      this.client.on(
        "transactionNotification",
        this.handleTransaction.bind(this)
      );

      // Set up health check
      this.setupHealthCheck();

      logSuccess("Vertigo listen service initialized");
    } catch (error) {
      logError(`Failed to initialize Vertigo listen service: ${error}`);
      throw error;
    }
  }

  private setupHealthCheck(): void {
    // Set up a periodic check to verify subscription health
    this.healthCheckInterval = setInterval(() => {
      const now = Date.now();
      const secondsSinceLastTx = Math.floor((now - this.lastTxTime) / 1000);
      log(
        `⏱️ Vertigo health check: ${secondsSinceLastTx}s since last transaction`,
        "info"
      );
    }, 30000);
  }

  private handleTransaction(notification: any): void {
    const txData = notification.params.result;

    // Update lastTxTime for health check
    this.lastTxTime = Date.now();

    // Check if Vertigo account is in the transaction
    const accountKeys =
      txData.transaction?.transaction?.message?.accountKeys || [];
    const hasVertigoAccount = accountKeys.some(
      (key: any) => key.pubkey === VERTIGO_PROGRAM_ID
    );

    if (!hasVertigoAccount) return;

    log(`🔎 Processing Vertigo transaction: ${txData.signature}`, "info");

    // Process Vertigo instructions
    const instructions =
      txData.transaction?.transaction?.message?.instructions || [];

    for (const ix of instructions) {
      if (ix.programId === VERTIGO_PROGRAM_ID) {
        this.processVertigoInstruction(ix, txData);
      }
    }
  }

  private processVertigoInstruction(ix: any, txData: any): void {
    // First, log the raw instruction data
    console.log(
      "Processing Vertigo instruction:",
      JSON.stringify({
        programId: ix.programId,
        data: ix.data.substring(0, 20) + "...", // Show just the start of the data
        accounts: ix.accounts.length,
      })
    );

    // Decode the instruction data
    const decoded = decodeVertigoInstructionData(ix.data);
    if (!decoded) {
      console.log("Failed to decode instruction data");
      return;
    }

    console.log(
      `Identified Vertigo instruction: ${decoded.name}`,
      decoded.data ? JSON.stringify(decoded.data) : "No data"
    );

    // Convert instruction names to lowercase for consistency
    const instructionName = decoded.name.toLowerCase();

    // Process based on instruction type
    switch (instructionName) {
      case "buy":
        this.processBuyInstruction(decoded, ix, txData);
        break;
      case "sell":
        console.log("Found sell instruction, processing...");
        this.processSellInstruction(decoded, ix, txData);
        break;
      case "create":
        this.processCreateInstruction(decoded, ix, txData);
        break;
      default:
        console.log(`Unhandled Vertigo instruction type: ${decoded.name}`);
        break;
    }
  }

  private processBuyInstruction(decoded: any, ix: any, txData: any): void {
    try {
      // Log essential information
      console.log(
        "Processing buy instruction with data:",
        JSON.stringify(decoded?.data?.params || {}, null, 2)
      );

      // Extract accounts with full public keys
      const accountsWithKeys = extractVertigoAccountsWithKeys(
        txData,
        ix,
        decoded.name
      );
      console.log(
        "Account pubkeys for buy:",
        JSON.stringify(accountsWithKeys || {}, null, 2)
      );

      if (!accountsWithKeys) {
        logError("Failed to extract account keys for buy instruction");
        return;
      }

      // Get instruction parameters
      const params = decoded.data?.params;
      if (!params || !params.amount) {
        logError("Missing parameters in buy instruction");
        return;
      }

      // Build normalized accounts from the extracted data
      const normalizedAccounts = {
        pool: accountsWithKeys.pool || "",
        user: accountsWithKeys.user || "",
        owner: accountsWithKeys.owner || "",
        mintA: accountsWithKeys.mintA || accountsWithKeys.mint_a || "",
        mintB: accountsWithKeys.mintB || accountsWithKeys.mint_b || "",
        userTaA: accountsWithKeys.userTaA || accountsWithKeys.user_ta_a || "",
        userTaB: accountsWithKeys.userTaB || accountsWithKeys.user_ta_b || "",
        vaultA: accountsWithKeys.vaultA || accountsWithKeys.vault_a || "",
        vaultB: accountsWithKeys.vaultB || accountsWithKeys.vault_b || "",
        tokenProgramA:
          accountsWithKeys.tokenProgramA ||
          accountsWithKeys.token_program_a ||
          "",
        tokenProgramB:
          accountsWithKeys.tokenProgramB ||
          accountsWithKeys.token_program_b ||
          "",
      };

      // Log normalized account details
      console.log(
        "Normalized account details:",
        JSON.stringify(normalizedAccounts, null, 2)
      );

      // Create the buy event with the normalized account data
      const buyEvent: VertigoBuyEvent = {
        signature: txData.signature,
        slot: txData.slot,
        instructionData: {
          amount: params.amount.toString(),
          limit: params.limit?.toString() || "0",
        },
        accounts: normalizedAccounts,
      };

      // Call the registered handler if available
      if (this.handlers.onBuy) {
        this.handlers.onBuy(buyEvent);
      }

      log(`Processed Vertigo buy event: ${txData.signature}`, "success");
    } catch (error) {
      logError(`Error processing buy instruction: ${error}`);
      console.error("Full error:", error);
    }
  }

  private processSellInstruction(decoded: any, ix: any, txData: any): void {
    try {
      // Log essential information
      console.log(
        "Processing sell instruction with data:",
        JSON.stringify(decoded?.data?.params || {}, null, 2)
      );

      // Extract the sell amount directly from parameters for fallback
      const sellAmount = decoded?.data?.params?.amount
        ? decoded.data.params.amount.toString()
        : "0";
      console.log("Sell amount directly from params:", sellAmount);

      // Extract accounts with full public keys
      const accountsWithKeys = extractVertigoAccountsWithKeys(
        txData,
        ix,
        decoded.name
      );
      console.log(
        "Account pubkeys for sell:",
        JSON.stringify(accountsWithKeys || {}, null, 2)
      );
      console.log("Type of accountsWithKeys:", typeof accountsWithKeys);
      console.log(
        "Keys in accountsWithKeys:",
        accountsWithKeys ? Object.keys(accountsWithKeys) : "No keys"
      );

      // The main issue might be that we're checking !accountsWithKeys but it's an empty object
      // Let's check for keys in the object instead
      if (!accountsWithKeys || Object.keys(accountsWithKeys).length === 0) {
        console.log("Account keys are empty or null for sell instruction");

        // Try using extractVertigoAccountsFromSell as a fallback
        const extractedAccounts = extractVertigoAccountsFromSell(
          txData,
          ix,
          decoded
        );
        console.log(
          "Extracted accounts fallback result:",
          extractedAccounts ? "success" : "failed"
        );

        if (extractedAccounts) {
          console.log(
            "Extracted accounts using fallback method:",
            JSON.stringify(extractedAccounts, null, 2)
          );
          this.processSellEventWithAccounts(extractedAccounts, txData, decoded);
          return;
        }

        console.log("Failed to extract valid sell account information");
        return;
      }

      // Get instruction parameters
      const params = decoded.data?.params;
      console.log(
        "Sell params check:",
        params ? JSON.stringify(params) : "No params"
      );

      if (!params || !params.amount) {
        logError("Missing parameters in sell instruction");
        return;
      }

      // Build normalized accounts from the extracted data
      const normalizedAccounts = {
        pool: accountsWithKeys.pool || "",
        user: accountsWithKeys.user || "",
        owner: accountsWithKeys.owner || "",
        mintA: accountsWithKeys.mintA || accountsWithKeys.mint_a || "",
        mintB: accountsWithKeys.mintB || accountsWithKeys.mint_b || "",
        userTaA: accountsWithKeys.userTaA || accountsWithKeys.user_ta_a || "",
        userTaB: accountsWithKeys.userTaB || accountsWithKeys.user_ta_b || "",
        vaultA: accountsWithKeys.vaultA || accountsWithKeys.vault_a || "",
        vaultB: accountsWithKeys.vaultB || accountsWithKeys.vault_b || "",
        tokenProgramA:
          accountsWithKeys.tokenProgramA ||
          accountsWithKeys.token_program_a ||
          "",
        tokenProgramB:
          accountsWithKeys.tokenProgramB ||
          accountsWithKeys.token_program_b ||
          "",
      };

      // Log normalized account details
      console.log(
        "Normalized account details:",
        JSON.stringify(normalizedAccounts, null, 2)
      );

      // Make sure we have essential account info
      if (!normalizedAccounts.pool || !normalizedAccounts.user) {
        console.log("Missing essential account info (pool or user)");
        return;
      }

      // Create the sell event with the normalized account data
      const sellEvent: VertigoSellEvent = {
        signature: txData.signature,
        slot: txData.slot,
        instructionData: {
          amount: params.amount.toString(),
          limit: params.limit?.toString() || "0",
        },
        accounts: normalizedAccounts,
      };

      // Calculate token balance changes from transaction metadata
      try {
        const meta = txData?.transaction?.meta;

        // Start with direct parameter values
        const tokenChanges: any = {};

        // Get token mint B decimals (if available)
        let mintBDecimals = 6; // Default to 6
        if (meta?.preTokenBalances) {
          const mintBBalance = meta.preTokenBalances.find(
            (b: any) => b.mint === normalizedAccounts.mintB
          );
          if (mintBBalance) {
            mintBDecimals = mintBBalance.uiTokenAmount.decimals;
          }
        }

        // Direct amount from params for mintB (input token)
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

        console.log(`Using direct param amount for mintB: ${sellAmount}`);

        // Check all inner instructions for token transfers
        if (meta?.innerInstructions && meta.innerInstructions.length > 0) {
          console.log(
            `Found ${meta.innerInstructions.length} inner instruction sets`
          );

          // Check each instruction set
          for (const innerSet of meta.innerInstructions) {
            if (!innerSet.instructions) continue;

            console.log(
              `Checking inner instruction set at index ${innerSet.index} with ${innerSet.instructions.length} instructions`
            );

            // Look for token transfers
            for (const instr of innerSet.instructions) {
              if (
                instr?.parsed?.type === "transferChecked" &&
                instr?.parsed?.info
              ) {
                const info = instr.parsed.info;
                const mint = info.mint;
                const amount = info.tokenAmount.amount;
                const decimals = info.tokenAmount.decimals;
                const uiAmount = info.tokenAmount.uiAmount;
                const source = info.source;
                const destination = info.destination;

                console.log(
                  `Found token transfer: mint=${mint}, amount=${amount}, from=${source.substring(0, 10)}..., to=${destination.substring(0, 10)}...`
                );

                // Check if this is mintB transfer (user selling token)
                if (mint === normalizedAccounts.mintB) {
                  if (source === normalizedAccounts.userTaB) {
                    // User sending tokens to vault = sell input
                    console.log(`✅ Found mintB transfer from user: ${amount}`);
                    tokenChanges.mintB = {
                      userInput: amount,
                      vaultReceived: amount,
                      decimals,
                      uiInput: uiAmount.toString(),
                      uiReceived: uiAmount.toString(),
                    };
                  }
                }
                // Check if this is mintA transfer (user receiving SOL/token)
                else if (mint === normalizedAccounts.mintA) {
                  if (destination === normalizedAccounts.userTaA) {
                    // Vault sending tokens to user = sell output
                    console.log(`✅ Found mintA transfer to user: ${amount}`);
                    tokenChanges.mintA = {
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
        }

        // Also verify from pre/post token balances
        if (meta?.preTokenBalances && meta.postTokenBalances) {
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

          console.log(
            `Found ${Object.keys(preBalances).length} pre balances and ${Object.keys(postBalances).length} post balances`
          );

          // Calculate mintB balance change (token being sold)
          const mintBKey = `${normalizedAccounts.mintB}-${normalizedAccounts.user}`;
          if (preBalances[mintBKey] && postBalances[mintBKey]) {
            const preBal = preBalances[mintBKey].uiTokenAmount;
            const postBal = postBalances[mintBKey].uiTokenAmount;
            const rawChange = (
              BigInt(postBal.amount) - BigInt(preBal.amount)
            ).toString();
            const uiChange = (postBal.uiAmount - preBal.uiAmount).toString();

            console.log(`MintB balance change: ${rawChange} (${uiChange})`);

            if (!tokenChanges.mintB) {
              tokenChanges.mintB = { decimals: preBal.decimals };
            }

            tokenChanges.mintB.userBalanceChange = rawChange;
            tokenChanges.mintB.uiUserBalanceChange = uiChange;

            // If negative change and no input amount set yet, this is likely what was sold
            if (rawChange.startsWith("-") && !tokenChanges.mintB.userInput) {
              const absChange = rawChange.substring(1); // Remove the negative sign
              tokenChanges.mintB.userInput = absChange;
              tokenChanges.mintB.vaultReceived = absChange;
              tokenChanges.mintB.uiInput = Math.abs(
                Number(uiChange)
              ).toString();
              tokenChanges.mintB.uiReceived = tokenChanges.mintB.uiInput;
              console.log(`Set mintB input from balance change: ${absChange}`);
            }
          }

          // Calculate mintA balance change (token being received)
          const mintAKey = `${normalizedAccounts.mintA}-${normalizedAccounts.user}`;
          if (preBalances[mintAKey] && postBalances[mintAKey]) {
            const preBal = preBalances[mintAKey].uiTokenAmount;
            const postBal = postBalances[mintAKey].uiTokenAmount;
            const rawChange = (
              BigInt(postBal.amount) - BigInt(preBal.amount)
            ).toString();
            const uiChange = (postBal.uiAmount - preBal.uiAmount).toString();

            console.log(`MintA balance change: ${rawChange} (${uiChange})`);

            if (!tokenChanges.mintA) {
              tokenChanges.mintA = { decimals: preBal.decimals };
            }

            tokenChanges.mintA.userBalanceChange = rawChange;
            tokenChanges.mintA.uiUserBalanceChange = uiChange;

            // If positive change and no received amount set yet, this is likely what was received
            if (
              !rawChange.startsWith("-") &&
              !tokenChanges.mintA.userReceived
            ) {
              tokenChanges.mintA.userReceived = rawChange;
              tokenChanges.mintA.vaultSent = rawChange;
              tokenChanges.mintA.uiReceived = uiChange;
              tokenChanges.mintA.uiSent = uiChange;
              console.log(`Set mintA output from balance change: ${rawChange}`);
            }
          }
        }

        // Add token changes to the event
        if (Object.keys(tokenChanges).length > 0) {
          (sellEvent as any).tokenChanges = tokenChanges;
          console.log(
            "Final token changes for sell event:",
            JSON.stringify(tokenChanges, null, 2)
          );
        }
      } catch (error) {
        console.error("Error calculating token changes:", error);
      }

      console.log("SELL EVENT CREATED:", JSON.stringify(sellEvent, null, 2));

      // Call the registered handler if available
      if (this.handlers.onSell) {
        this.handlers.onSell(sellEvent);
        console.log("Sell handler called successfully");
      } else {
        console.log("No sell handler registered");
      }

      log(`Processed Vertigo sell event: ${txData.signature}`, "success");
    } catch (error) {
      logError(`Error processing sell instruction: ${error}`);
      console.error("Full error:", error);
    }
  }

  private processSellEventWithAccounts(
    extractedAccounts: any,
    txData: any,
    decoded: any
  ): void {
    try {
      // Get instruction parameters
      const params = decoded.data?.params;
      if (!params || !params.amount) {
        logError("Missing parameters in sell instruction (alternative method)");
        return;
      }

      console.log(
        "Processing sell event with accounts. Params:",
        JSON.stringify(params)
      );
      console.log(
        "Token changes available:",
        extractedAccounts.tokenChanges ? "Yes" : "No"
      );

      if (extractedAccounts.tokenChanges) {
        console.log(
          "Token changes:",
          JSON.stringify(extractedAccounts.tokenChanges)
        );
      }

      // Construct sell event using extracted accounts
      const sellEvent: VertigoSellEvent = {
        signature: txData.signature,
        slot: txData.slot,
        instructionData: {
          amount: params.amount.toString(),
          limit: params.limit?.toString() || "0",
        },
        accounts: {
          pool: extractedAccounts.pool || "",
          user: extractedAccounts.user || "",
          owner: extractedAccounts.owner || "",
          mintA: extractedAccounts.mint_a || "",
          mintB: extractedAccounts.mint_b || "",
          userTaA: extractedAccounts.user_ta_a || "",
          userTaB: extractedAccounts.user_ta_b || "",
          vaultA: extractedAccounts.vault_a || "",
          vaultB: extractedAccounts.vault_b || "",
          tokenProgramA: extractedAccounts.token_program_a || "",
          tokenProgramB: extractedAccounts.token_program_b || "",
        },
      };

      // Add tokenChanges information if available
      if (extractedAccounts.tokenChanges) {
        // Add additional fields to the event to include token changes
        (sellEvent as any).tokenChanges = {
          mintA: extractedAccounts.tokenChanges.mintA || {},
          mintB: extractedAccounts.tokenChanges.mintB || {},
        };

        // Log the calculated amounts
        const mintAChange =
          extractedAccounts.tokenChanges.mintA?.userBalanceChange || "0";
        const mintBChange =
          extractedAccounts.tokenChanges.mintB?.userBalanceChange || "0";
        console.log(
          `Sell transaction changes: mintA=${mintAChange}, mintB=${mintBChange}`
        );
      }

      // Log normalized account details for debugging
      console.log(
        "Sell event with alternative method:",
        JSON.stringify(sellEvent, null, 2)
      );

      // Call the registered handler if available
      if (this.handlers.onSell) {
        this.handlers.onSell(sellEvent);
        console.log("Sell handler called successfully");
      } else {
        console.log("No sell handler registered");
      }

      log(
        `Processed Vertigo sell event (alternative method): ${txData.signature}`,
        "success"
      );
    } catch (error) {
      logError(`Error processing sell event with extracted accounts: ${error}`);
      console.error("Full error:", error);
    }
  }

  private processCreateInstruction(decoded: any, ix: any, txData: any): void {
    try {
      // Extract accounts with full public keys
      const accountsWithKeys = extractVertigoAccountsWithKeys(
        txData,
        ix,
        decoded.name
      );
      if (!accountsWithKeys) {
        logError("Failed to extract account keys for create instruction");
        return;
      }

      // Get instruction parameters
      const params = decoded.data?.params;
      if (!params) {
        logError("Missing parameters in create instruction");
        return;
      }

      // Normalize account keys (handle both snake_case and camelCase properties)
      const normalizedAccounts = {
        payer: accountsWithKeys.payer,
        owner: accountsWithKeys.owner,
        tokenWalletAuthority:
          accountsWithKeys.tokenWalletAuthority ||
          accountsWithKeys.token_wallet_authority,
        mintA: accountsWithKeys.mintA || accountsWithKeys.mint_a,
        mintB: accountsWithKeys.mintB || accountsWithKeys.mint_b,
        tokenWalletB:
          accountsWithKeys.tokenWalletB || accountsWithKeys.token_wallet_b,
        pool: accountsWithKeys.pool,
        vaultA: accountsWithKeys.vaultA || accountsWithKeys.vault_a,
        vaultB: accountsWithKeys.vaultB || accountsWithKeys.vault_b,
      };

      // Log account details for debugging
      console.log(
        "Normalized create pool account details:",
        normalizedAccounts
      );

      // Construct create pool event
      const createEvent: VertigoCreatePoolEvent = {
        signature: txData.signature,
        slot: txData.slot,
        instructionData: {
          shift: params.shift?.toString(),
          initialTokenBReserves: params.initialTokenBReserves?.toString(),
          feeParams: params.feeParams
            ? {
                normalizationPeriod:
                  params.feeParams.normalizationPeriod?.toString(),
                decay: params.feeParams.decay?.toString(),
                reference: params.feeParams.reference?.toString(),
                royaltiesBps: params.feeParams.royaltiesBps?.toString(),
                privilegedSwapper:
                  params.feeParams.privilegedSwapper?.toString(),
              }
            : undefined,
        },
        accounts: normalizedAccounts,
      };

      // Call the registered handler if available
      if (this.handlers.onCreatePool) {
        this.handlers.onCreatePool(createEvent);
      }

      log(
        `Processed Vertigo create pool event: ${txData.signature}`,
        "success"
      );
    } catch (error) {
      logError(`Error processing create instruction: ${error}`);
    }
  }

  public cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}
