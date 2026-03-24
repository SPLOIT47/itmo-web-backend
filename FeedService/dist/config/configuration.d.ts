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
declare const _default: () => FeedServiceConfig;
export default _default;
