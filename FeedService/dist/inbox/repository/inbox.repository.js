"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InboxRepository = void 0;
const common_1 = require("@nestjs/common");
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../../db/db");
const schema_1 = require("../../db/schema");
let InboxRepository = class InboxRepository {
    async exists(eventId, tx = db_1.db) {
        const rows = await tx
            .select({ eventId: schema_1.inbox_events.eventId })
            .from(schema_1.inbox_events)
            .where((0, drizzle_orm_1.eq)(schema_1.inbox_events.eventId, eventId))
            .limit(1);
        return rows.length > 0;
    }
    async getLastVersionForAggregate(aggregateId, tx = db_1.db) {
        const rows = await tx
            .select({ version: schema_1.inbox_events.version })
            .from(schema_1.inbox_events)
            .where((0, drizzle_orm_1.eq)(schema_1.inbox_events.aggregateId, aggregateId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.inbox_events.version))
            .limit(1);
        return rows[0]?.version ?? null;
    }
    async save(data, tx = db_1.db) {
        await tx.insert(schema_1.inbox_events).values(data).onConflictDoNothing({
            target: [schema_1.inbox_events.aggregateId, schema_1.inbox_events.version],
        });
    }
};
exports.InboxRepository = InboxRepository;
exports.InboxRepository = InboxRepository = __decorate([
    (0, common_1.Injectable)()
], InboxRepository);
//# sourceMappingURL=inbox.repository.js.map