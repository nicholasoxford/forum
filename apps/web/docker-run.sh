#!/bin/bash

# Build the Docker image
echo "Building Docker image..."
docker build -t forum-web -f apps/web/Dockerfile .

# Run the Docker container
echo "Running Docker container..."
docker run -p 3000:3000 \
  -v "$(pwd)/apps/web/.env.local:/app/apps/web/.env.local" \
  forum-web

# You can also use this to run with explicit environment variables:
# docker run -p 3000:3000 \
#  -e NEXTAUTH_SECRET=your_secret \
#  -e NEXTAUTH_URL=http://localhost:3000 \
#  -e RPC_URL=your_rpc_url \
#  [more environment variables as needed] \
#  forum-web 