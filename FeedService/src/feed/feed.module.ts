import { Module } from "@nestjs/common";
import { FeedController } from "./controller/feed.controller";
import { FeedService } from "./service/feed.service";
import { FeedRepository } from "./repository/feed.repository";
import { FeedSourceRepository } from "./repository/feed-source.repository";

@Module({
    controllers: [FeedController],
    providers: [FeedService, FeedRepository, FeedSourceRepository],
    exports: [FeedRepository, FeedSourceRepository],
})
export class FeedModule {}

