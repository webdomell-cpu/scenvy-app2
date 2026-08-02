# Step 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm install

# Copy source files
COPY . .

# Build Vite frontend and Express server bundle
RUN npm run build

# Step 2: Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy built dist directory from builder stage
COPY --from=builder /app/dist ./dist

# Expose Cloud Run default port
EXPOSE 8080

# Start server
CMD ["node", "dist/server.cjs"]
