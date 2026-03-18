# MediaService

Инфраструктурный сервис для хранения media-файлов в MinIO и metadata в PostgreSQL.

## Env

```bash
PORT=3000
DATABASE_URL=postgres://user:pass@localhost:5432/media

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=media
MINIO_USE_SSL=false

MAX_UPLOAD_SIZE_BYTES=10485760
```

## Run

```bash
npm i
npm run start:dev
```

Swagger: `/docs`

