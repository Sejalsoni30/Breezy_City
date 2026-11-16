# Multi-stage production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install all dependencies (including devDependencies for building)
RUN npm install

# Copy source code
COPY . .

# Build server and client
RUN npm run build

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy root and workspace package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install only production dependencies
RUN npm install --omit=dev

# Copy compiled artifacts from builder
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3001

CMD ["node", "server/dist/server.js"]
