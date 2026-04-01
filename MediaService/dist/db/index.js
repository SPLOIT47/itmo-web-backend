"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DbInitService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = exports.DbModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const pg_1 = require("pg");
const node_postgres_1 = require("drizzle-orm/node-postgres");
const schema = __importStar(require("./schema"));
exports.schema = schema;
let DbInitService = DbInitService_1 = class DbInitService {
    config;
    pool;
    log = new common_1.Logger(DbInitService_1.name);
    constructor(config, pool) {
        this.config = config;
        this.pool = pool;
    }
    async onModuleInit() {
        const databaseUrl = this.config.get('database.url', { infer: true }) ?? '';
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
};
DbInitService = DbInitService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService, pg_1.Pool])
], DbInitService);
let DbModule = class DbModule {
};
exports.DbModule = DbModule;
exports.DbModule = DbModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: 'PG_POOL',
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const url = config.get('database.url', { infer: true });
                    return new pg_1.Pool({ connectionString: url });
                },
            },
            {
                provide: 'DRIZZLE',
                inject: ['PG_POOL'],
                useFactory: (pool) => {
                    return (0, node_postgres_1.drizzle)(pool, { schema });
                },
            },
            {
                provide: DbInitService,
                inject: [config_1.ConfigService, 'PG_POOL'],
                useFactory: (config, pool) => new DbInitService(config, pool),
            },
        ],
        exports: ['PG_POOL', 'DRIZZLE', DbInitService],
    })
], DbModule);
