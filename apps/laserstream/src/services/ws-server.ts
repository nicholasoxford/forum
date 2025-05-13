import { EventEmitter } from "events";
import { log, logSuccess, logWarning } from "../utils/logger";
import type { Server, ServerWebSocket } from "bun";

interface WebSocketData {
  eventHandler: (event: any) => void;
}

// Create a WebSocket server for clients to connect to
export function startWebSocketServer(port = 3000): {
  server: Server;
  eventEmitter: EventEmitter;
} {
  // Create an event emitter for publishing events
  const eventEmitter = new EventEmitter();

  // Create Bun WebSocket server
  const server = Bun.serve<WebSocketData, any>({
    port,
    fetch(req, server) {
      // Upgrade HTTP requests to WebSocket connections
      if (server.upgrade(req)) {
        return;
      }
      return new Response("Pump Transaction Monitor - WebSocket server", {
        headers: { "Content-Type": "text/plain" },
      });
    },
    websocket: {
      open(ws) {
        logSuccess("WebSocket client connected");

        // Set up event listener for pump events
        const eventHandler = (event: any) => {
          ws.send(JSON.stringify(event));
        };

        // Store the event handler in the WebSocket data for cleanup
        ws.data.eventHandler = eventHandler;

        // Subscribe to pump events
        eventEmitter.on("pump-event", eventHandler);
      },

      message(ws, message) {
        log(`Received message from client: ${message.toString()}`);
      },

      close(ws) {
        logWarning("WebSocket client disconnected");
        // Remove event listener
        eventEmitter.off("pump-event", ws.data.eventHandler);
      },
    },
  });

  logSuccess(`WebSocket server running at http://localhost:${port}`);

  return { server, eventEmitter };
}
