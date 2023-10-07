# Stage 1: Base image with NodeJS and NPM
FROM node:20-bullseye-slim

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Stage 2: Build the application
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# Copy everything from the first stage
COPY --from=0 /app .

# Build the application
RUN npm run build

# Stage 3: Run the application
FROM node:20-bullseye-slim
ENV PORT=8000
WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Expose port 1337
EXPOSE 8000

# Start the application
CMD [ "npm", "start" ]