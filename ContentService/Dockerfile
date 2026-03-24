FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
COPY ContentService/package*.json ./ContentService/
COPY packages/contracts/package*.json ./packages/contracts/
RUN npm ci --fetch-retries=10 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY ContentService ./ContentService
COPY packages/contracts ./packages/contracts

WORKDIR /app/packages/contracts
RUN npm run build

WORKDIR /app/ContentService
RUN npm run build

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY ContentService/package*.json ./ContentService/
COPY packages/contracts/package*.json ./packages/contracts/

RUN npm ci --fetch-retries=10 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY --from=builder /app/ContentService/dist ./ContentService/dist
COPY --from=builder /app/ContentService/drizzle.config.ts ./ContentService/drizzle.config.ts
COPY --from=builder /app/ContentService/src/db ./ContentService/src/db
COPY --from=builder /app/packages/contracts/dist ./packages/contracts/dist

WORKDIR /app/ContentService

EXPOSE 3000
CMD ["sh", "-c", "npm run db:push && npm run start:prod"]

