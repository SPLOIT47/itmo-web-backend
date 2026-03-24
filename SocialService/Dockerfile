FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm install --fetch-retries=10 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
# Keep dev deps because drizzle-kit is used at runtime by db:push.
RUN npm install --fetch-retries=10 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/db ./src/db

EXPOSE 3000
CMD ["sh", "-c", "npm run db:push && node dist/main.js"]

