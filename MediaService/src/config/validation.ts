import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
  DATABASE_URL: Joi.string().required(),

  MINIO_ENDPOINT: Joi.string().required(),
  MINIO_PORT: Joi.number().integer().min(1).max(65535).default(9000),
  MINIO_ACCESS_KEY: Joi.string().required(),
  MINIO_SECRET_KEY: Joi.string().required(),
  MINIO_BUCKET: Joi.string().required(),
  MINIO_USE_SSL: Joi.boolean().truthy('true').falsy('false').default(false),
  MINIO_PUBLIC_BASE_URL: Joi.string().uri().optional(),

  MAX_UPLOAD_SIZE_BYTES: Joi.number().integer().min(1).default(10 * 1024 * 1024),
});

