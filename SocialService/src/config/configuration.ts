export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  database: {
    url: process.env.DATABASE_URL!,
  },
  kafka: {
    brokers: (process.env.KAFKA_BROKERS ?? '')
      .split(',')
      .map((b) => b.trim())
      .filter(Boolean),
    socialTopic: process.env.KAFKA_SOCIAL_TOPIC!,
  },
});
