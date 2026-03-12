# SocialService

Source-of-truth сервис для социальных связей:

- friendships + friend requests
- communities + memberships
- community details + links
- Kafka events через outbox pattern

## Env

```bash
PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/social
KAFKA_BROKERS=localhost:9092
KAFKA_SOCIAL_TOPIC=social.topic
```

## Run

```bash
npm i
npm run start:dev
```

Swagger: `/docs`
