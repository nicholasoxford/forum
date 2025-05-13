# Solana Keypair Grinding Service

This service continuously generates Solana keypairs with specific suffixes (e.g., "fun") and stores them in the database for later use in token mints.

## Features

- Automatically generates keypairs ending with a specified suffix
- Uses the Solana CLI for fast grinding when available
- Fallback to JS implementation when Solana CLI is unavailable
- Stores keypairs securely in the database
- API endpoints to check grinding status

## Environment Variables

The service requires the following environment variables:

```
# Service configuration
PORT=3001                  # Port to expose the API
DEFAULT_SUFFIX=fun         # The suffix to search for
BATCH_SIZE=5               # Number of keypairs to generate in each batch
GRINDING_INTERVAL_MS=60000 # Interval between batches in milliseconds (default: 1 minute)

# Database configuration (from @workspace/db)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_user
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=your_database
```

## API Endpoints

### Health Check

```
GET /health
```

Response:

```json
{
  "status": "ok"
}
```

### Grinding Stats

```
GET /stats
```

Response:

```json
{
  "status": "ok",
  "stats": [
    {
      "suffix": "fun",
      "count": 42,
      "used": 5
    }
  ]
}
```

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun dev

# Build for production
bun run build
```

## Docker

From the monorepo root:

```bash
# Build the Docker image
docker build -t keypair-grinding-service -f apps/grind/Dockerfile .

# Run the container
docker run -p 3001:3001 \
  -e MYSQL_HOST=your_mysql_host \
  -e MYSQL_PORT=3306 \
  -e MYSQL_USER=your_user \
  -e MYSQL_PASSWORD=your_password \
  -e MYSQL_DATABASE=your_database \
  -e DEFAULT_SUFFIX=fun \
  -e BATCH_SIZE=10 \
  keypair-grinding-service
```

## Usage with Token Creation

Once you have grinded a sufficient number of keypairs, they will be used automatically by the token creation service when `useFunKeypair` is set to `true` in the token configuration.
