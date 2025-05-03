FROM oven/bun:1 AS build

WORKDIR /app

# Copy root files needed for workspace setup
COPY package.json bun.lock tsconfig.json ./

# Copy all workspace package.json files first for better layer caching
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/solana/package.json ./packages/solana/package.json
COPY packages/transactions/package.json ./packages/transactions/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/vertigo/package.json ./packages/vertigo/package.json
COPY apps/server/package.json ./apps/server/package.json

# Install dependencies
RUN bun install

# Copy source code
COPY packages/eslint-config ./packages/eslint-config
COPY packages/typescript-config ./packages/typescript-config
COPY packages/db ./packages/db
COPY packages/solana ./packages/solana
COPY packages/transactions ./packages/transactions
COPY packages/types ./packages/types
COPY packages/vertigo ./packages/vertigo
COPY apps/server ./apps/server

# Set environment variables
ENV NODE_ENV=production

# Build and compile the server
WORKDIR /app
RUN bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile /app/server \
    ./apps/server/src/index.ts

# We can't use distroless for libsql native modules
FROM debian:bookworm-slim

WORKDIR /app

COPY --from=build /app/server server


# Copy the .env file if needed (or use environment variables in production)
# COPY --from=build /app/apps/server/.env.production .env

ENV NODE_ENV=production

# Use environment variable PORT with fallback to 3000
CMD ["./server"]

EXPOSE 3000 