export type FeedServiceConfig = {
    port: number;
    databaseUrl: string;
    kafkaBrokers: string[];
    kafkaGroupId: string;
    contentTopic: string;
    socialTopic: string;
    kafkaSubscribeFromBeginning: boolean;
    feedMaxSize: number;
    contentServiceUrl: string;
    socialServiceUrl: string;
};

export default (): FeedServiceConfig => {
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    const kafkaBrokers = (process.env.KAFKA_BROKERS ?? "kafka:9092")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    return {
        port,
        databaseUrl: process.env.DATABASE_URL ?? "",
        kafkaBrokers,
        kafkaGroupId: process.env.KAFKA_GROUP_ID ?? "feed-service",
        contentTopic: process.env.KAFKA_CONTENT_TOPIC ?? "content.topic",
        socialTopic: process.env.KAFKA_SOCIAL_TOPIC ?? "social.topic",
        kafkaSubscribeFromBeginning:
            (process.env.KAFKA_SUBSCRIBE_FROM_BEGINNING ?? "true")
                .toLowerCase() === "true",
        feedMaxSize: process.env.FEED_MAX_SIZE
            ? Number(process.env.FEED_MAX_SIZE)
            : 500,
        contentServiceUrl:
            process.env.CONTENT_SERVICE_URL ?? "http://localhost:3003",
        socialServiceUrl:
            process.env.SOCIAL_SERVICE_URL ?? "http://localhost:3004",
    };
};

