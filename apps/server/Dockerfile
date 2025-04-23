FROM oven/bun:1 AS build

WORKDIR /app

# Copy root files for workspace setup
COPY package.json bun.lock ./

# Copy package.json files from all workspace packages
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
COPY packages/typescript-config/package.json ./packages/typescript-config/package.json
COPY apps/server/package.json ./apps/server/package.json

# Install dependencies
RUN bun install

# Copy source code
COPY packages/eslint-config ./packages/eslint-config
COPY packages/typescript-config ./packages/typescript-config
COPY apps/server ./apps/server

# Set environment variables
ENV NODE_ENV=production

# Build and compile the server
WORKDIR /app/apps/server
RUN bun build \
    --compile \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile /app/server \
    ./src/index.ts

# We can't use distroless for libsql native modules
FROM debian:bookworm-slim

WORKDIR /app

COPY --from=build /app/server server
COPY --from=build /app/node_modules/@libsql /app/node_modules/@libsql

# Copy the .env file if needed (or use environment variables in production)
# COPY --from=build /app/apps/server/.env.production .env

ENV NODE_ENV=production

# Use environment variable PORT with fallback to 3000
CMD ["./server"]

EXPOSE 3000 