# Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /build

# Dummy database URL for build
ENV DATABASE_URL="mongodb://build:build@localhost:27017/build"

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy prisma and source files
COPY prisma ./prisma/
COPY tsconfig.json ./
COPY src ./src/

# Generate Prisma client and build
RUN npx prisma generate
RUN pnpm run build
RUN pnpm prune --prod
RUN rm -rf src tsconfig.json .pnpm-store

# Production stage
FROM node:22-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Set working directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy with correct ownership
COPY --from=builder --chown=nodejs:nodejs /build/package.json ./
COPY --from=builder --chown=nodejs:nodejs /build/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /build/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /build/prisma ./prisma

# Create logs directory and set ownership
RUN mkdir -p /app/logs && chown -R nodejs:nodejs /app/logs

# Declare volume mount point
VOLUME ["/app/logs"]

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Run application
CMD ["node", "dist/index.js"]