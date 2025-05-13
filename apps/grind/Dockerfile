# Build stage
FROM oven/bun:1 AS build

WORKDIR /app

# Copy root files needed for workspace setup
COPY package.json bun.lock tsconfig.json ./

# Copy all workspace package.json files first for better layer caching
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY packages/schemas/package.json ./packages/schemas/package.json
COPY packages/services/package.json ./packages/services/package.json
COPY packages/solana/package.json ./packages/solana/package.json
COPY packages/telegram/package.json ./packages/telegram/package.json
COPY packages/transactions/package.json ./packages/transactions/package.json
COPY packages/types/package.json ./packages/types/package.json
COPY packages/vertigo/package.json ./packages/vertigo/package.json

COPY apps/grind/package.json ./apps/grind/package.json

# Install dependencies
RUN bun install

# Copy source code
COPY packages/eslint-config ./packages/eslint-config
COPY packages/typescript-config ./packages/typescript-config
COPY packages/auth ./packages/auth
COPY packages/db ./packages/db
COPY packages/schemas ./packages/schemas
COPY packages/solana ./packages/solana
COPY packages/telegram ./packages/telegram
COPY packages/types ./packages/types
COPY packages/transactions ./packages/transactions
COPY packages/services ./packages/services
COPY packages/vertigo ./packages/vertigo
COPY apps/grind ./apps/grind

# Set environment variables
ENV NODE_ENV=production

# Add Solana to PATH
ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"

# Final stage
FROM oven/bun:1

WORKDIR /app

# Copy installed dependencies and source code from the build stage
COPY --from=build /app /app

# Install Solana CLI with required dependencies
RUN apt-get update && \
    apt-get install -y curl libudev-dev libssl-dev pkg-config build-essential && \
    sh -c "$(curl -sSfL https://release.solana.com/v1.16.23/install)" && \
    apt-get -y clean

# Add Solana to PATH
ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"
ENV NODE_ENV=production

# Configurable environment variables with defaults
ENV PORT=3001
ENV DEFAULT_SUFFIX="fun"
ENV BATCH_SIZE=5
ENV GRINDING_INTERVAL_MS=60000

# Run the grinding service
CMD ["bun", "run", "./apps/grind/src/index.ts"]

EXPOSE 3001