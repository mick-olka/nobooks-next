FROM node:latest

WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json pnpm-lock.yaml ./

# Install the application dependencies
RUN npm install -g pnpm
RUN pnpm install

# Copy the rest of the application files
COPY . .

# Build the NextJS application
RUN pnpm run build

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["pnpm", "start"]
