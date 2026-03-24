import Joi from "joi";

export const validationSchema = Joi.object({
    PORT: Joi.number().integer().min(1).max(65535).required(),
    DATABASE_URL: Joi.string().uri().required(),
    KAFKA_BROKERS: Joi.string().required(),
    KAFKA_GROUP_ID: Joi.string().required(),
    KAFKA_CONTENT_TOPIC: Joi.string().default("content.topic"),
    KAFKA_SOCIAL_TOPIC: Joi.string().default("social.topic"),
    KAFKA_SUBSCRIBE_FROM_BEGINNING: Joi.boolean().default(true),
    FEED_MAX_SIZE: Joi.number().integer().min(1).max(5000).required(),
    CONTENT_SERVICE_URL: Joi.string().uri().optional(),
});

