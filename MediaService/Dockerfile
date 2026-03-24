FROM node:20-alpine as builder

WORKDIR /app

COPY package*.json ./
COPY MediaService/package*.json ./MediaService/
RUN npm ci --fetch-retries=10 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY MediaService ./MediaService

WORKDIR /app/MediaService
RUN npm run build

FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY MediaService/package*.json ./MediaService/
RUN npm ci --omit=dev --fetch-retries=10 --fetch-retry-mintimeout=20000 --fetch-retry-maxtimeout=120000

COPY --from=builder /app/MediaService/dist ./MediaService/dist

WORKDIR /app/MediaService
EXPOSE 3000
CMD ["node", "dist/main.js"]

