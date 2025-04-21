# Vertigo Pool Test Scripts

This directory contains scripts for testing the Vertigo AMM functionality.

## Prerequisites

Before running the test scripts, make sure you have:

1. Set up your environment variables in a `.env` file at the root of the project:

   ```
   VERTIGO_SECRET_KEY=your_private_key_here
   PAYER_PRIVATE_KEY=your_private_key_here
   ```

2. Have a token mint and token wallet on Solana devnet that you want to create a pool for.

3. Have the Next.js development server running:

   ```bash
   bun run dev
   ```

## Available Scripts

### 1. Create a Vertigo Pool (`test-vertigo-pool.ts`)

This script creates a new Vertigo pool for an existing token by calling the API endpoint.

To run:

```bash
bun run apps/web/scripts/test-vertigo-pool.ts
```

### 2. Test Trading (`test-vertigo-trade.ts`)

This script tests buying and selling tokens from an existing Vertigo pool by calling the API endpoints.

To run:

```bash
bun run apps/web/scripts/test-vertigo-trade.ts
```

### 3. Test Claiming Royalties (`test-vertigo-claim.ts`)

This script tests claiming royalties from an existing Vertigo pool by calling the API endpoint.

To run:

```bash
bun run apps/web/scripts/test-vertigo-claim.ts
```

## Configuration

Before running each script, you need to update the following variables:

### For `test-vertigo-pool.ts`:

- `TOKEN_MINT`: Your token mint address
- `TOKEN_WALLET`: Your token wallet address
- `OWNER_ADDRESS`: Your wallet address that will own the pool

### For `test-vertigo-trade.ts`:

- `POOL_OWNER`: The address of the pool owner
- `TOKEN_MINT_B`: Your token mint address
- `USER_ADDRESS`: Your wallet address
- `USER_TOKEN_A_WALLET`: Your SOL wallet address
- `USER_TOKEN_B_WALLET`: Your token wallet address

### For `test-vertigo-claim.ts`:

- `POOL_ADDRESS`: The address of the pool
- `RECEIVER_TOKEN_A_WALLET`: The SOL wallet address to receive royalties
- `OWNER_ADDRESS`: Your wallet address that owns the pool

## What the Scripts Do

### Create a Vertigo Pool

1. Sends a request to the `/api/vertigo/launch-pool` endpoint
2. Creates a Vertigo pool for your existing token
3. Prints the pool address, transaction signature, and explorer links

### Test Trading

1. Sends a request to the `/api/vertigo/buy-tokens` endpoint to buy tokens
2. Sends a request to the `/api/vertigo/sell-tokens` endpoint to sell tokens
3. Prints transaction signatures and explorer links

### Test Claiming Royalties

1. Sends a request to the `/api/vertigo/claim-royalties` endpoint
2. Claims accumulated royalties from the pool
3. Prints transaction signature and explorer link

## Troubleshooting

If you encounter errors:

1. Make sure your environment variables are set correctly
2. Verify that your token mint and wallet addresses are valid
3. Ensure you have enough SOL in your wallet for the transaction
4. Check that your private key has the necessary permissions
5. Make sure the Next.js development server is running

## Additional Notes

- All scripts call the API endpoints defined in the `app/api/vertigo` directory
- The API endpoints use the functions from the `vertigo.ts` library
- The scripts connect to Solana devnet by default
- You can customize the parameters in each script to suit your needs
