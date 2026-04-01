FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
COPY FeedService/package*.json ./FeedService/
COPY packages/contracts/package*.json ./packages/contracts/
RUN npm ci --fetch-retries=10 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY FeedService ./FeedService
COPY packages/contracts ./packages/contracts

WORKDIR /app/packages/contracts
RUN npm run build

WORKDIR /app/FeedService
RUN npm run build

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY FeedService/package*.json ./FeedService/
COPY packages/contracts/package*.json ./packages/contracts/

RUN npm ci --fetch-retries=10 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY --from=builder /app/FeedService/dist ./FeedService/dist
COPY --from=builder /app/FeedService/drizzle.config.ts ./FeedService/drizzle.config.ts
COPY --from=builder /app/FeedService/src/db ./FeedService/src/db
COPY --from=builder /app/packages/contracts/dist ./packages/contracts/dist

WORKDIR /app/FeedService

EXPOSE 3000
CMD ["sh", "-c", "npm run db:push && npm run start:prod"]

