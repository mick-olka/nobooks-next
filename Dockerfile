# Use the official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Install dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json pnpm-lock.yaml* .npmrc* ./

# Install dependencies
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN pnpm run build

# Expose the port the app runs on
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Run the application
CMD ["pnpm", "start"]
