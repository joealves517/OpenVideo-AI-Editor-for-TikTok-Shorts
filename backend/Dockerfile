# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy package management files
COPY package.json tsconfig.json ./

# Install all dependencies including devDependencies for compiling TypeScript
RUN npm install

# Copy source code
COPY src ./src

# Compile TypeScript to JavaScript
RUN npm run build

# Runtime stage
FROM node:20-slim

RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy compiled files from builder
COPY --from=builder /app/dist ./dist

# Standard Cloud Run port is 8080
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Run the app
CMD ["npm", "start"]
