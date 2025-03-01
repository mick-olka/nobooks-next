# # Development stage
# FROM node:18-alpine AS development

# # Install pnpm globally
# RUN npm install -g pnpm

# # Set working directory
# WORKDIR /app

# # Copy package files
# COPY package.json pnpm-lock.yaml ./

# # Install dependencies
# RUN pnpm install

# # Copy the rest of the application
# COPY . .

# # Expose port 3000
# EXPOSE 3000

# # Start development server
# CMD ["pnpm", "dev"]

# Production build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy application code
COPY . .

# Build application
RUN pnpm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Set Node environment to production
ENV NODE_ENV=production

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

# Expose port 3000
EXPOSE 3000

# Start production server
CMD ["pnpm", "start"]