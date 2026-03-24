import { Global, Injectable, Logger, Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

@Injectable()
class DbInitService implements OnModuleInit {
  private readonly log = new Logger(DbInitService.name);

  constructor(private readonly config: ConfigService, private readonly pool: Pool) {}

  async onModuleInit(): Promise<void> {
    const databaseUrl = this.config.get<string>('database.url', { infer: true }) ?? '';
    if (!databaseUrl) {
      return;
    }

    await this.pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS media_files (
        media_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_user_id uuid NOT NULL,
        bucket varchar(255) NOT NULL,
        object_key varchar(1024) NOT NULL UNIQUE,
        original_filename varchar(1024) NOT NULL,
        mime_type varchar(255) NOT NULL,
        size_bytes bigint NOT NULL,
        kind varchar(64) NOT NULL,
        metadata jsonb,
        created_at timestamp NOT NULL DEFAULT now(),
        deleted_at timestamp,
        version integer NOT NULL DEFAULT 0
      );
    `);
    await this.pool.query(`
      CREATE INDEX IF NOT EXISTS media_files_owner_user_id_created_at_idx
      ON media_files (owner_user_id, created_at);
    `);
    this.log.log('Ensured media_files table exists');
  }
}

@Global()
@Module({
  providers: [
    {
      provide: 'PG_POOL',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('database.url', { infer: true });
        return new Pool({ connectionString: url });
      },
    },
    {
      provide: 'DRIZZLE',
      inject: ['PG_POOL'],
      useFactory: (pool: Pool): Database => {
        return drizzle(pool, { schema });
      },
    },
    {
      provide: DbInitService,
      inject: [ConfigService, 'PG_POOL'],
      useFactory: (config: ConfigService, pool: Pool) => new DbInitService(config, pool),
    },
  ],
  exports: ['PG_POOL', 'DRIZZLE', DbInitService],
})
export class DbModule {}

export { schema };

