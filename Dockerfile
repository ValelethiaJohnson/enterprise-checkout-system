# Stage 1: Build & Type Compilation
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY tsconfig.json ./
COPY src ./src/
RUN npx prisma generate && npm run build

# Stage 2: Hardened Non-Root Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 -S fintech && adduser -S checkout -u 1001 -G fintech
COPY --from=builder --chown=checkout:fintech /app/package*.json ./
COPY --from=builder --chown=checkout:fintech /app/node_modules ./node_modules
COPY --from=builder --chown=checkout:fintech /app/dist ./dist
USER checkout
EXPOSE 4000
CMD ["node", "dist/index.js"]
