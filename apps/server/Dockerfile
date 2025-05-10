FROM oven/bun:1 AS build

WORKDIR /app

# Copy root files needed for workspace setup
COPY package.json bun.lock tsconfig.json ./

# Copy all workspace package.json files first for better layer caching
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/solana/package.json ./packages/solana/package.json
COPY packages/services/package.json ./packages/services/package.json
COPY packages/transactions/package.json ./packages/transactions/package.json
COPY packages/telegram/package.json ./packages/telegram/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/vertigo/package.json ./packages/vertigo/package.json

COPY apps/server/package.json ./apps/server/package.json

# Install dependencies
RUN bun install

# Copy source code
COPY packages/eslint-config ./packages/eslint-config
COPY packages/typescript-config ./packages/typescript-config
COPY packages/auth ./packages/auth
COPY packages/db ./packages/db
COPY packages/solana ./packages/solana
COPY packages/transactions ./packages/transactions
COPY packages/services ./packages/services
COPY packages/types ./packages/types
COPY packages/vertigo ./packages/vertigo
COPY packages/telegram ./packages/telegram
COPY apps/server ./apps/server

# Set environment variables
ENV NODE_ENV=production

# ~~Build and compile the server~~
# WORKDIR /app
# RUN bun build \
#     --compile \
#     --target node \
#     --outfile /app/server \
#     ./apps/server/src/index.ts

# Use the same Bun image for the final stage to ensure Bun is available
FROM oven/bun:1

WORKDIR /app

# Copy installed dependencies and source code from the build stage
COPY --from=build /app /app

ENV NODE_ENV=production

# Use environment variable PORT with fallback to 3000
# Ensure the entry point path is correct relative to the WORKDIR
CMD ["bun", "run", "./apps/server/src/index.ts"]

EXPOSE 3000 