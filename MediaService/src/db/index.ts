import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export type Database = NodePgDatabase<typeof schema>;

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
  ],
  exports: ['PG_POOL', 'DRIZZLE'],
})
export class DbModule {}

export { schema };

