import { Global, Module } from '@nestjs/common';
import { OutboxRepository } from './repository/outbox.repository';
import { OutboxPublisher } from './publisher/outbox.publisher';

@Global()
@Module({
  providers: [OutboxRepository, OutboxPublisher],
  exports: [OutboxRepository],
})
export class OutboxModule {}

