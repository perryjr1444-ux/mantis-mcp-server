FROM node:20-slim

# Install Python and dependencies for Mantis
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install Node dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Copy Mantis framework
COPY --from=mantis /Users/c0nfig/claude/Mantits /mantis

# Install Python dependencies for Mantis
WORKDIR /mantis
RUN pip3 install -r requirements.txt

# Generate SSH host key for SSH honeypot
RUN ssh-keygen -t rsa -f ssh_host_key.key -N ""

# Back to app directory
WORKDIR /app

# Create logs directory
RUN mkdir -p logs

# Expose ports
EXPOSE 2121 2222 8080 4445 2323

# Set environment variables
ENV MANTIS_PATH=/mantis
ENV NODE_ENV=production

# Run the MCP server
CMD ["node", "dist/index.js"]