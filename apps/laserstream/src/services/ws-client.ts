import WebSocket from "ws";
import { log, logError, logSuccess, logWarning } from "../utils/logger";
import { EventEmitter } from "events";
import {
  processVertigoTransaction,
  VERTIGO_PROGRAM_ID,
  isVertigoTransaction,
} from "../parsers/protocol-parser";

// WebSocket client for connecting to Helius
export async function startWebSocketClient(
  wsUrl: string,
  eventEmitter: EventEmitter,
  pingInterval = 30000
) {
  log(`Starting WebSocket client for Vertigo transactions...`);
  log(`Using WebSocket URL: ${wsUrl}`);

  // Create a client WebSocket
  const socket = new WebSocket(wsUrl);

  // Function to send subscription request
  const sendSubscriptionRequest = () => {
    log("Sending transaction subscription request...");
    const request = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "transactionSubscribe",
      params: [
        {
          accountInclude: [VERTIGO_PROGRAM_ID],
          vote: false,
          failed: false, // Only include successful transactions
        },
        {
          commitment: "confirmed",
          encoding: "jsonParsed",
          transactionDetails: "full",
          showRewards: false,
          maxSupportedTransactionVersion: 0,
        },
      ],
    });
    socket.send(request);
  };

  // Setup event handlers
  socket.on("open", () => {
    logSuccess("WebSocket connection established!");
    sendSubscriptionRequest();

    // Send pings to keep connection alive
    const pingIntervalId = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        const pingMsg = JSON.stringify({ jsonrpc: "2.0", method: "ping" });
        socket.send(pingMsg);
        // Don't log pings to reduce noise
      }
    }, pingInterval);

    // Clear interval if socket closes
    socket.on("close", () => clearInterval(pingIntervalId));
  });

  socket.on("message", (data: WebSocket.Data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.method === "transactionNotification") {
        const txData = message.params.result;
        const signature = txData.signature;

        // Check if transaction is successful
        if (txData.meta?.err) {
          logWarning(`Failed transaction: ${signature.slice(0, 8)}...`);
          return;
        }

        // Process Vertigo transaction
        if (isVertigoTransaction(txData)) {
          const processedVertigoEvent = processVertigoTransaction(txData);
          if (processedVertigoEvent) {
            eventEmitter.emit("vertigo-event", processedVertigoEvent);
          }
        }
      } else if (message.id === 1 && message.result !== undefined) {
        logSuccess(`Successfully subscribed with ID: ${message.result}`);
      } else if (message.method === "pong") {
        // Don't log pongs to reduce noise
      } else {
        log(`Received message: ${message.method || "unknown"}`);
      }
    } catch (error) {
      logError(`Error processing WebSocket message: ${error}`);
    }
  });

  socket.on("error", (error: Error) => {
    logError(`WebSocket error: ${error.message || JSON.stringify(error)}`);
  });

  socket.on("close", (code: number, reason: string) => {
    logWarning(`WebSocket connection closed: ${code} - ${reason}`);
    // Return a promise that resolves when reconnection is needed
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        log("Attempting to reconnect WebSocket...");
        resolve();
      }, 5000);
    });
  });

  // Return the socket instance for external management
  return socket;
}
