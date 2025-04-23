# Elysia API Server

This is an API server built with Elysia.js that provides endpoints for file uploads and metadata storage using Cloudflare R2.

## Features

- Generate presigned URLs for direct uploads to R2
- Store and retrieve metadata as JSON
- Delete files from R2 storage

## Environment Variables

The server requires the following environment variables:

```
# Server configuration
PORT=3000

# Cloudflare R2 configuration
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_BUCKET_NAME=your_bucket_name
R2_PUBLIC_URL=https://your-public-url.example.com
```

## API Endpoints

### Generate Upload URL

```
POST /api/upload-url
```

Request body:

```json
{
  "key": "path/to/file.jpg",
  "contentType": "image/jpeg"
}
```

Response:

```json
{
  "uploadUrl": "https://presigned-url-for-upload",
  "publicUrl": "https://public-url-to-access-file"
}
```

### Store Metadata

```
POST /api/metadata
```

Request body:

```json
{
  "name": "Token Name",
  "symbol": "TKN",
  "description": "Token description",
  "image": "https://public-url-to-image"
}
```

Response:

```json
{
  "uri": "https://public-url-to-metadata-json"
}
```

### Delete File

```
DELETE /api/file?url=https://public-url-to-file
```

Response:

```json
{
  "success": true
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
docker build -t elysia-server -f apps/server/Dockerfile .

# Run the container
docker run -p 3000:3000 \
  -e R2_ACCESS_KEY_ID=your_access_key_id \
  -e R2_SECRET_ACCESS_KEY=your_secret_access_key \
  -e R2_ACCOUNT_ID=your_cloudflare_account_id \
  -e R2_BUCKET_NAME=your_bucket_name \
  -e R2_PUBLIC_URL=your_public_url \
  elysia-server
```
