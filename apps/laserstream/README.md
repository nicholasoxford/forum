# Pump Transactions Monitor

A Node.js application for monitoring Pump protocol transactions on Solana using Helius LaserStream.

## Features

- Real-time monitoring of Pump protocol transactions
- WebSocket server for clients to receive transaction updates
- Parses and formats transaction data for easy reading
- Automatic reconnection on connection failures

## Prerequisites

- Node.js 18 or higher
- Helius API key (get one at [https://dev.helius.xyz/dashboard/app](https://dev.helius.xyz/dashboard/app))

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the project root:
   ```bash
   npm run setup
   ```
4. Edit the `.env` file and add your Helius LaserStream WebSocket URL:

   ```
   HELIUS_WS_URL=wss://atlas-mainnet.helius-rpc.com/ws?api-key=YOUR_API_KEY_HERE
   ```

   **IMPORTANT:** The URL must:

   - Include the `/ws` path
   - Include your API key as a query parameter
   - Follow the format: `wss://atlas-mainnet.helius-rpc.com/ws?api-key=YOUR_API_KEY_HERE`

## Usage

Start in development mode with auto-reload:

```bash
npm run dev
```

Start in production mode:

```bash
npm start
```

Build the application:

```bash
npm run build
```

## Troubleshooting

### 401 Unauthorized Error

If you see a "401 Unauthorized" error, your API key is either:

- Missing from the URL
- Invalid or expired
- Not formatted correctly in the URL

Make sure your URL follows this exact format: `wss://atlas-mainnet.helius-rpc.com/ws?api-key=YOUR_API_KEY_HERE`

### Connection Issues

If you're having trouble connecting:

1. Verify your Helius API key is active in your Helius dashboard
2. Make sure your URL includes the `/ws` path
3. Check that your API key is included as a query parameter

## WebSocket Server

The application runs a WebSocket server on port 3000. Clients can connect to receive transaction updates in real-time:

```javascript
const ws = new WebSocket('ws://localhost:3000')

ws.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('Received transaction:', data)
}
```

## License

MIT
