# Forum - Exclusive Token-based Telegram Group Chats

A next-generation social platform that creates token-gated Telegram group chats with innovative economic incentives for members.

## About

Forum uses Solana's Token 2022 transfer fee mechanism to create an innovative social platform where:

1. Each token launch creates an exclusive Telegram group chat
2. Members need to hold a specific amount of tokens to join
3. Every time the token is swapped, fees accrue to the platform
4. These fees are distributed hourly to all token holders in the group

This is inspired by [Infinite Money Glitch](https://www.coingecko.com/en/coins/infinite-money-glitch) and uses the [Vertigo Protocol](https://vertigo.gitbook.io/vertigo-docs) for Solana token interactions.

## Technology Stack

- **Frontend Framework**: Next.js 15 with React 19
- **Backend**: Elysia.js running on Bun
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: DrizzleORM
- **Blockchain**: Solana (Web3.js, SPL Token, MPL Token Metadata)
- **Authentication**: Solana wallet connect
- **Messaging**: Telegram API integration

## Getting Started

### Prerequisites

- Bun 1.2.11+

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/forum.git
   cd forum
   ```

2. Install dependencies

   ```bash
   bun install
   ```

3. Create a `.env.local` file in the `apps/web` directory with your environment variables

   ```
   RPC_URL=your_solana_rpc_url
   VERTIGO_SECRET_KEY=your_vertigo_secret_key
   # Add other required environment variables
   ```

4. Run the development server

   ```bash
   bun run dev
   ```

5. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

This is a Turborepo monorepo with the following structure:

- **apps/**

  - **web/**: Next.js frontend application
  - **server/**: Elysia.js backend API

- **packages/**
  - **ui/**: Shared UI components with shadcn/ui
  - **db/**: Database schema and utilities
  - **solana/**: Solana utilities and transaction helpers
  - **vertigo/**: Vertigo protocol integration
  - **telegram/**: Telegram API integration
  - **auth/**: Authentication utilities
  - **services/**: Shared services
  - **types/**: TypeScript type definitions
  - **transactions/**: Transaction utilities
  - **eslint-config/**: Shared ESLint configuration
  - **typescript-config/**: Shared TypeScript configuration

## Adding UI Components

To add UI components to your app, run:

```bash
bun dlx shadcn@latest add button -c apps/web
```

This will place the UI components in the `packages/ui/src/components` directory.

## Using UI Components

To use components in your app, import them from the `ui` package:

```tsx
import { Button } from "@workspace/ui/components/button";
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the [MIT License](LICENSE).
