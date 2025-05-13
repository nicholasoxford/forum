FROM node:22-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY tsconfig.json ./
COPY src ./src
COPY .env* ./

# Build the app
RUN npm run build

# Production image
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.env* ./

# Set environment variables
ENV NODE_ENV=production

# Run the app
CMD ["node", "dist/index.js"] 