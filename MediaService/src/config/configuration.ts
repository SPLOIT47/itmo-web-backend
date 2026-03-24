export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    url: process.env.DATABASE_URL!,
  },
  minio: {
    endpoint: process.env.MINIO_ENDPOINT!,
    port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
    bucket: process.env.MINIO_BUCKET!,
    useSSL: (process.env.MINIO_USE_SSL ?? 'false').toLowerCase() === 'true',
    /** Публичный base URL для ссылок, которые открывает браузер (например http://localhost:9000). */
    publicBaseUrl: process.env.MINIO_PUBLIC_BASE_URL?.trim() || undefined,
  },
  upload: {
    maxSizeBytes: parseInt(process.env.MAX_UPLOAD_SIZE_BYTES ?? String(10 * 1024 * 1024), 10),
  },
});

