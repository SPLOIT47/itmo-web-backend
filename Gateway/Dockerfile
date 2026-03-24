FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
COPY Gateway/package*.json ./Gateway/
COPY packages/contracts ./packages/contracts/
RUN npm ci --fetch-retries=10 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY Gateway ./Gateway
COPY packages/contracts ./packages/contracts

WORKDIR /app/Gateway
RUN npm run build

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY Gateway/package*.json ./Gateway/
COPY --from=builder /app/packages/contracts ./packages/contracts/
RUN npm ci --omit=dev --fetch-retries=10 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY --from=builder /app/Gateway/dist ./Gateway/dist

WORKDIR /app/Gateway
EXPOSE 4000
CMD ["node", "dist/main.js"]

