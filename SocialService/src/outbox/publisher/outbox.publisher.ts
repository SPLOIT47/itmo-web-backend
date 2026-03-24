import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, type Producer } from 'kafkajs';
import { OutboxRepository } from '../repository/outbox.repository';

@Injectable()
export class OutboxPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisher.name);
  private producer: Producer | null = null;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  async onModuleInit() {
    const brokers = ((this.config.get('kafka.brokers', { infer: true }) as unknown) as string[]) ?? [];
    const kafka = new Kafka({ clientId: 'social-service', brokers });
    this.producer = kafka.producer();
    await this.producer.connect();

    const intervalMs = 1000;
    this.timer = setInterval(() => {
      this.processOnce().catch((err) => this.logger.error(err?.stack ?? String(err)));
    }, intervalMs);
  }

  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.producer) await this.producer.disconnect();
  }

  private async processOnce() {
    if (!this.producer) return;

    const topic = this.config.get<string>('kafka.socialTopic', { infer: true });
    if (!topic) return;

    const batch = await this.outboxRepository.getPendingBatch(100);
    if (batch.length === 0) return;

    for (const evt of batch) {
      try {
        await this.producer.send({
          topic,
          messages: [
            {
              key: evt.eventType,
              value: JSON.stringify({
                eventId: evt.outboxEventId,
                eventType: evt.eventType,
                payload: evt.payload,
                createdAt:
                  evt.createdAt instanceof Date
                    ? evt.createdAt.toISOString()
                    : String(evt.createdAt),
              }),
            },
          ],
        });
        await this.outboxRepository.markAsSent(evt.outboxEventId);
      } catch (err: any) {
        await this.outboxRepository.markAsError(evt.outboxEventId, err?.message ?? String(err));
      }
    }
  }
}

