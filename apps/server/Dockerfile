FROM oven/bun:1 AS build

WORKDIR /app

# Copy root files for workspace setup
COPY package.json bun.lock ./

# Copy package.json files from all workspace packages
COPY packages/ui/package.json ./packages/ui/package.json
COPY apps/server/package.json ./apps/server/package.json

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/ui ./packages/ui
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

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server

# Copy the .env file if needed (or use environment variables in production)
# COPY --from=build /app/apps/server/.env.production .env

ENV NODE_ENV=production

# Use environment variable PORT with fallback to 3000
CMD ["./server"]

EXPOSE 3000 