export interface KafkaEvent {
    key: string;
    topic: string;
    value: unknown;
}