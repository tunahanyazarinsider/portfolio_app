# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (layer caching: only re-install if these change)
COPY package.json package-lock.json* ./

# Install dependencies (use npm ci once package-lock.json is fully in sync)
RUN npm install

# Copy source code
COPY . .

# Accept build-time env vars for API URLs (baked into the static build)
ARG REACT_APP_AUTH_API=http://localhost:8000
ARG REACT_APP_STOCK_API=http://localhost:8001
ARG REACT_APP_WATCHLIST_API=http://localhost:8002
ENV REACT_APP_AUTH_API=$REACT_APP_AUTH_API
ENV REACT_APP_STOCK_API=$REACT_APP_STOCK_API
ENV REACT_APP_WATCHLIST_API=$REACT_APP_WATCHLIST_API

# Build the application
RUN npm run build

# Production stage — nginx:alpine is ~7MB vs node:alpine ~78MB
FROM nginx:alpine

# Copy built app from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
