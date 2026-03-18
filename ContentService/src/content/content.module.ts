import { Module } from "@nestjs/common";
import { OutboxModule } from "../outbox/outbox.module";
import { ContentService } from "./service/content.service";
import { PostsController } from "./controller/posts.controller";
import { PostRepository } from "./repository/post.repository";
import { CommentRepository } from "./repository/comment.repository";
import { LikeRepository } from "./repository/like.repository";

@Module({
    imports: [OutboxModule],
    controllers: [PostsController],
    providers: [
        ContentService,
        PostRepository,
        CommentRepository,
        LikeRepository,
    ],
})
export class ContentModule {}

