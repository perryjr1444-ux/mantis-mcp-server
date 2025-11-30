# Multi-architecture build optimized for Raspberry Pi 5 (ARM64)
FROM node:20-slim

# Set platform-specific optimizations
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Install Python and dependencies for Mantis (ARM64 optimized)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    openssh-client \
    build-essential \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install Node dependencies with ARM64 optimization
RUN npm ci --prefer-offline --no-audit

# Copy source code
COPY src ./src

# Build TypeScript with optimizations
RUN npm run build

# Create mantis directory structure
RUN mkdir -p /mantis

# Note: Mantis Python framework should be cloned/installed separately
# For development, mount as volume: -v /path/to/mantis:/mantis
# For production, use multi-stage build or package mantis separately

# Create logs and data directories
RUN mkdir -p logs data

# Generate SSH host key for SSH honeypot (if needed)
RUN mkdir -p /mantis/keys && \
    ssh-keygen -t rsa -b 4096 -f /mantis/keys/ssh_host_key.key -N "" -C "mantis-honeypot"

# Set environment variables
ENV MANTIS_PATH=/mantis
ENV NODE_ENV=production
ENV PYTHON_PATH=/usr/bin/python3

# Expose decoy service ports
EXPOSE 2121 2222 8080 4445 2323

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "console.log('healthy')" || exit 1

# Run the MCP server
CMD ["node", "dist/index.js"]