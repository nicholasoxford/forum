import WebSocket from "ws";
import { EventEmitter } from "events";
import {
  LaserStreamConfig,
  AccountSubscribeRequest,
  TransactionSubscribeRequest,
  WebSocketMessage,
  AccountSubscribeParams,
  TransactionSubscribeFilter,
  TransactionSubscribeParams,
  ProgramSubscribeParams,
  ProgramSubscribeRequest,
} from "./types";

export class LaserStreamClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: LaserStreamConfig;
  private pingInterval: NodeJS.Timeout | null = null;
  private requestId = 1;

  constructor(config: LaserStreamConfig) {
    super();
    this.config = {
      ...config,
      pingInterval: config.pingInterval || 30000, // Default to 30 seconds
    };
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.config.apiKey) {
          return reject(
            new Error("API key is required for Helius LaserStream connections")
          );
        }

        // Format WebSocket URL with API key using format from Helius example
        // From "wss://atlas-mainnet.helius-rpc.com/?api-key=" + API_KEY
        const baseUrl = this.config.wsUrl;
        const wsUrl = `${baseUrl}${this.config.apiKey}`;

        // Log URL (hiding API key)
        const logUrl = wsUrl.replace(this.config.apiKey, "API_KEY_HIDDEN");
        console.log(`Connecting to: ${logUrl}`);

        this.ws = new WebSocket(wsUrl);

        this.ws.on("open", () => {
          console.log("WebSocket connection established");
          this.startPingInterval();
          resolve();
        });

        this.ws.on("message", (data: WebSocket.Data) => {
          try {
            const message = JSON.parse(data.toString()) as WebSocketMessage;
            this.handleMessage(message);
            // Forward the raw message to listeners
            this.emit("message", message);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        });

        this.ws.on("error", (error: Error) => {
          console.error("WebSocket error:", error);
          this.emit("error", error);
        });

        this.ws.on("close", (code: number, reason: string) => {
          console.log(`WebSocket closed: ${code} - ${reason}`);
          this.clearPingInterval();
          this.emit("close", { code, reason });
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.ws) {
      this.clearPingInterval();
      this.ws.close();
      this.ws = null;
    }
  }

  public subscribeToAccount(
    accountId: string,
    params?: AccountSubscribeParams
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error("WebSocket is not connected"));
      }

      const id = this.requestId++;
      const request: AccountSubscribeRequest = {
        jsonrpc: "2.0",
        id,
        method: "accountSubscribe",
        params: [accountId, params],
      };

      this.ws.send(JSON.stringify(request), (error) => {
        if (error) {
          return reject(error);
        }
        resolve(id);
      });
    });
  }

  public subscribeToTransactions(
    filter?: TransactionSubscribeFilter,
    params?: TransactionSubscribeParams
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error("WebSocket is not connected"));
      }

      const id = this.requestId++;
      const request: TransactionSubscribeRequest = {
        jsonrpc: "2.0",
        id,
        method: "transactionSubscribe",
        params: [filter, params],
      };

      this.ws.send(JSON.stringify(request), (error) => {
        if (error) {
          return reject(error);
        }
        resolve(id);
      });
    });
  }

  public subscribeToProgram(
    programId: string,
    params?: ProgramSubscribeParams
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return reject(new Error("WebSocket is not connected"));
      }

      const id = this.requestId++;
      const request: ProgramSubscribeRequest = {
        jsonrpc: "2.0",
        id,
        method: "programSubscribe",
        params: [programId, params],
      };

      this.ws.send(JSON.stringify(request), (error) => {
        if (error) {
          return reject(error);
        }
        resolve(id);
      });
    });
  }

  private handleMessage(message: WebSocketMessage): void {
    // Log all incoming messages to diagnose subscription issues

    // Handle subscription responses
    if ("id" in message && "result" in message) {
      this.emit("subscription", {
        id: message.id,
        subscriptionId: message.result,
      });
      return;
    }

    // Handle notifications
    if ("method" in message && message.method === "accountNotification") {
      this.emit("accountNotification", message);
      return;
    }

    if ("method" in message && message.method === "transactionNotification") {
      this.emit("transactionNotification", message);
      return;
    }

    if ("method" in message && message.method === "programNotification") {
      this.emit("programNotification", message);
      return;
    }
  }

  private startPingInterval(): void {
    this.clearPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
        console.log("Ping sent");
      }
    }, this.config.pingInterval);
  }

  private clearPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}
