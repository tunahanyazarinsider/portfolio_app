# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve to run the production build
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/build ./build

# Expose port
EXPOSE 3000

# Start the application
CMD ["serve", "-s", "build", "-l", "3000"]
