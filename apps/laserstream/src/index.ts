import type { Server, ServerWebSocket } from "bun";
import { VERTIGO_PROGRAM_ID } from "./parsers/protocol-parser";
import { decodeVertigoInstructionData } from "./parsers/vertigo-parser";
import { log, logSuccess, logWarning, logError } from "./utils/logger";
import { LaserStreamClient } from "./client";

// Load environment variables from .env file

// Parse command line arguments
const args = process.argv.slice(2);
const mutedPrograms: string[] = [];
let argIndex = args.indexOf("--mute");
while (argIndex !== -1) {
  if (args[argIndex + 1] && !args[argIndex + 1].startsWith("--")) {
    mutedPrograms.push(args[argIndex + 1]);
  }
  args.splice(
    argIndex,
    args[argIndex + 1] && !args[argIndex + 1].startsWith("--") ? 2 : 1
  );
  argIndex = args.indexOf("--mute");
}

// Get environment variables
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";
const HELIUS_WS_URL =
  process.env.HELIUS_WS_URL || "wss://atlas-devnet.helius-rpc.com/?api-key=";
const PING_INTERVAL = parseInt(process.env.PING_INTERVAL || "30000", 10);

// Log the WebSocket URL with masked API key
const maskedUrl = HELIUS_WS_URL.includes("api-key=")
  ? HELIUS_WS_URL.replace(/api-key=([^&]+)/, "api-key=***MASKED***")
  : HELIUS_WS_URL;
log(`Using WebSocket URL: ${maskedUrl}`, "info");

// Check if a program is muted
const isProgramMuted = (programId: string) => mutedPrograms.includes(programId);

// Start the new LaserStreamClient
async function startLaserStreamClient(server: Server) {
  log(`Starting LaserStreamClient for monitoring programs...`, "event");

  // Initialize the LaserStream client
  const client = new LaserStreamClient({
    apiKey: HELIUS_API_KEY,
    wsUrl: HELIUS_WS_URL,
    pingInterval: PING_INTERVAL,
  });

  // Handle connection events
  client.on("error", (error) => {
    logError(`WebSocket error: ${error}`);
  });

  client.on("close", ({ code, reason }) => {
    logWarning(`WebSocket connection closed: ${code} - ${reason}`);

    // Reconnect after a short delay
    setTimeout(async () => {
      logWarning(`Attempting to reconnect LaserStreamClient...`);
      await connectLaserStream(client, server);
    }, 5000);
  });

  await connectLaserStream(client, server);
}

// Connect LaserStreamClient and set up subscriptions
async function connectLaserStream(client: LaserStreamClient, server: Server) {
  try {
    log("Connecting to Helius LaserStream...", "info");
    await client.connect();
    logSuccess("Connected to Helius LaserStream");

    // Subscribe to Vertigo transactions if not muted
    if (!isProgramMuted(VERTIGO_PROGRAM_ID)) {
      const directVertigoSubscriptionId = await client.subscribeToTransactions(
        {
          accountInclude: ["vrTGoBuy5rYSxAfV3jaRJWHH6nN9WK4NRExGxsk1bCJ"],
        },
        {
          commitment: "processed",
          encoding: "jsonParsed",
          transactionDetails: "full",
          maxSupportedTransactionVersion: 0,
        }
      );
      logSuccess(
        `Subscribed directly to Vertigo with ID: ${directVertigoSubscriptionId}`
      );
    }

    logSuccess("All subscriptions set up and listeners attached");

    // Set up a periodic check to verify subscription health
    let lastTxTime = Date.now();
    const healthCheckInterval = setInterval(() => {
      const now = Date.now();
      const secondsSinceLastTx = Math.floor((now - lastTxTime) / 1000);
      console.log(
        `⏱️ Health check: ${secondsSinceLastTx}s since last transaction`
      );
      console.log(
        `👀 Watching for Vertigo transactions on program: ${VERTIGO_PROGRAM_ID}`
      );
    }, 30000);

    // Update the lastTxTime whenever we receive a transaction
    client.on("transactionNotification", () => {
      lastTxTime = Date.now();
    });

    // Modify the client.on("transactionNotification") callback to include decoding instruction data
    client.on("transactionNotification", (notification) => {
      const txData = notification.params.result;

      // Update lastTxTime for the health check
      lastTxTime = Date.now();

      // Always output something for EVERY transaction
      console.log(
        `📌 Transaction ${txData.signature} received at slot ${txData.slot}`
      );

      // Determine which program is involved

      // Check if Vertigo account is in the transaction
      const accountKeys =
        txData.transaction?.transaction?.message?.accountKeys || [];
      const hasVertigoAccount = accountKeys.some(
        (key: any) => key.pubkey === VERTIGO_PROGRAM_ID
      );

      if (hasVertigoAccount) {
        console.log("🔎 VERTIGO ACCOUNT FOUND IN TRANSACTION!");
        console.log(
          `Transaction details: ${JSON.stringify({ signature: txData.signature, slot: txData.slot })}`
        );

        // Extract and decode Vertigo instruction data
        const instructions =
          txData.transaction?.transaction?.message?.instructions || [];
        for (const ix of instructions) {
          if (ix.programId === VERTIGO_PROGRAM_ID) {
            console.log(
              "Found Vertigo instruction, decoding data...: ",
              ix.data
            );
            const decoded = decodeVertigoInstructionData(ix.data);
            if (decoded) {
              console.log(`Decoded Vertigo instruction: ${decoded.name}`);
              console.log(`Instruction data:`, decoded.data);
            }
          }
        }
      }
    });
  } catch (error) {
    logError(`Failed to connect or subscribe: ${error}`);

    // Retry connection after a delay
    setTimeout(() => {
      log("Attempting to reconnect...", "warning");
      connectLaserStream(client, server);
    }, 5000);
  }
}

// Local WebSocket server for publishing events
interface WebSocketData {
  subscriptions: Set<string>;
}

function startWebSocketServer() {
  // Create WebSocket server using Bun's native API
  const server = Bun.serve<WebSocketData, any>({
    port: 4040,
    fetch(req, server) {
      // Upgrade HTTP request to WebSocket connection
      if (
        server.upgrade(req, {
          data: { subscriptions: new Set(["transactions"]) },
        })
      ) {
        return;
      }
      return new Response("Transaction Monitor - WebSocket server", {
        headers: { "Content-Type": "text/plain" },
      });
    },
    websocket: {
      open(ws) {
        logSuccess(`WebSocket client connected`);
        ws.subscribe("transactions");
      },

      message(ws, message) {
        // Handle client messages (not used for now)
        log(`Received message from client: ${message.toString()}`);
      },

      close(ws) {
        logWarning(`WebSocket client disconnected`);
      },
    },
  });

  logSuccess(`WebSocket server running at http://localhost:${server.port}`);
  return server;
}

// Modify the startMonitoring function to run the test
async function startMonitoring() {
  try {
    // Display a nice banner
    const banner = `
\x1b[35m╔═════════════════════════════════════════════════════════════╗
║                                                             ║
║  \x1b[96m████████ ██████   █████  ███    ██ ███████  █████   ██████  \x1b[35m║
║  \x1b[96m   ██    ██   ██ ██   ██ ████   ██ ██      ██   ██ ██       \x1b[35m║
║  \x1b[96m   ██    ██████  ███████ ██ ██  ██ ███████ ███████ ██       \x1b[35m║
║  \x1b[96m   ██    ██   ██ ██   ██ ██  ██ ██      ██ ██   ██ ██       \x1b[35m║
║  \x1b[96m   ██    ██   ██ ██   ██ ██   ████ ███████ ██   ██  ██████  \x1b[35m║
║                                                             ║
║                  \x1b[33mTransactions Monitor v1.1\x1b[35m                  ║
║                                                             ║
╚═════════════════════════════════════════════════════════════╝\x1b[0m
`;
    console.log(banner);

    log("Starting transaction monitoring...", "event");

    if (mutedPrograms.length > 0) {
      log(`Muted programs: ${mutedPrograms.join(", ")}`, "info");
    }

    // Start local WebSocket server for clients to connect to
    const server = startWebSocketServer();

    // Use the new LaserStreamClient implementation
    startLaserStreamClient(server);

    logSuccess("Transaction monitoring started successfully");
  } catch (error) {
    logError(`Error starting monitoring: ${error}`);
  }
}

// Gracefully handle process termination
process.on("SIGINT", () => {
  logWarning("Shutting down...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logWarning("Shutting down...");
  process.exit(0);
});

// Start the monitoring
startMonitoring().catch((error) => {
  console.error("Failed to start monitoring:", error);
  process.exit(1);
});
