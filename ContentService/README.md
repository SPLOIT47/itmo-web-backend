# ContentService

ContentService is the write/source-of-truth microservice for posts, comments and likes.

## Running locally

1. Install dependencies from the monorepo root:

   ```bash
   npm install
   ```

2. Generate Prisma client:

   ```bash
   npm run prisma:generate -w ContentService
   ```

3. Configure database and Kafka in `ContentService/.env`:

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/content
   KAFKA_BROKERS=localhost:9092
   KAFKA_CONTENT_TOPIC=content.topic
   PORT=3002
   ```

4. Start the service:

   ```bash
   npm run start:dev -w ContentService
   ```

