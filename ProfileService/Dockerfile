FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY ProfileService/package*.json ./ProfileService/
COPY packages/contracts/package*.json ./packages/contracts/

RUN npm ci --fetch-retries=10 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY ProfileService ./ProfileService
COPY packages/contracts ./packages/contracts

WORKDIR /app/packages/contracts
RUN npm run build

WORKDIR /app/ProfileService
RUN npm run build

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY ProfileService/package*.json ./ProfileService/
COPY packages/contracts/package*.json ./packages/contracts/

RUN npm ci --omit=dev --fetch-retries=10 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY --from=builder /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=builder /app/ProfileService/dist ./ProfileService/dist
COPY --from=builder /app/ProfileService/drizzle.config.ts ./ProfileService/drizzle.config.ts
COPY --from=builder /app/ProfileService/src/db ./ProfileService/src/db

WORKDIR /app/ProfileService

EXPOSE 3000

CMD ["sh", "-c", "npm run db:push && npm run start:prod"]