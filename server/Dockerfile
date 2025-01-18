# Build stage
FROM node:20.16-alpine3.19 AS builder

WORKDIR /build

# Install build dependencies
COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.json ./

RUN npm install

# Copy source code
COPY . .

# Generate Prisma Client and build
RUN npx prisma generate
RUN npm run build

# Production stage
FROM node:20.16-alpine3.19

WORKDIR /app

# Copy production dependencies and built files
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build/package*.json ./
COPY --from=builder /build/prisma ./prisma

EXPOSE 3001

CMD ["npm", "start"]