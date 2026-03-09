import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Kafka, Producer } from "kafkajs";

@Injectable()
export class KafkaProducer implements OnModuleInit, OnModuleDestroy {
    private producer: Producer | null = null;

    async onModuleInit() {
        const envBrokers = process.env.KAFKA_BROKERS;

        if (!envBrokers) {
            throw new Error(
                "KAFKA_BROKERS are required in environment variables",
            );
        }

        const brokers = envBrokers.split(",").map((s) => s.trim());

        const kafka = new Kafka({
            clientId: "content-service",
            brokers,
        });

        this.producer = kafka.producer();
        await this.producer.connect();
    }

    async onModuleDestroy() {
        if (!this.producer) return;

        await this.producer.disconnect();
    }

    async send(topic: string, key: string, value: any) {
        if (!this.producer) {
            throw new Error("Kafka producer is not initialized");
        }

        await this.producer.send({
            topic,
            messages: [
                {
                    key,
                    value: JSON.stringify(value),
                },
            ],
        });
    }
}

