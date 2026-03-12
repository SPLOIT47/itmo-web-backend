import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
  DATABASE_URL: Joi.string().required(),
  KAFKA_BROKERS: Joi.string().required(),
  KAFKA_SOCIAL_TOPIC: Joi.string().required(),
});

