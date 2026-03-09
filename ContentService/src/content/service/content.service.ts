import {
    Injectable,
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from "@nestjs/common";
import { db } from "../../db/db";
import { PostRepository } from "../repository/post.repository";
import { CommentRepository } from "../repository/comment.repository";
import { LikeRepository } from "../repository/like.repository";
import { OutboxRepository } from "../../outbox/repository/outbox.repository";
import {
    PostCreatedPayload,
    PostDeletedPayload,
    PostLikedPayload,
    PostUnlikedPayload,
    PostUpdatedPayload,
    CommentCreatedPayload,
    CommentDeletedPayload,
} from "@app/contracts/kafka/content";
import { CreatePostDto } from "../dto/create-post.dto";
import { UpdatePostDto } from "../dto/update-post.dto";
import { CreateCommentDto } from "../dto/create-comment.dto";

@Injectable()
export class ContentService {
    constructor(
        private readonly postRepo: PostRepository,
        private readonly commentRepo: CommentRepository,
        private readonly likeRepo: LikeRepository,
        private readonly outbox: OutboxRepository,
    ) {}

    async createPost(authorId: string, dto: CreatePostDto) {
        return db.transaction(async (tx) => {
            const post = await this.postRepo.create(
                {
                    authorId,
                    text: dto.text,
                    media: dto.media ?? [],
                },
                tx,
            );

            const payload: PostCreatedPayload = {
                postId: post.postId,
                authorId: post.authorId,
                text: post.text,
                media: post.media,
                createdAt: post.createdAt.toISOString(),
                version: post.version,
            };

            await this.outbox.create("POST_CREATED", payload, tx);

            return post;
        });
    }

    async getPost(postId: string) {
        const post = await this.postRepo.findByIdNotDeleted(postId);

        if (!post) {
            throw new NotFoundException("Post not found");
        }

        return post;
    }

    async updatePost(authorId: string, postId: string, dto: UpdatePostDto) {
        return db.transaction(async (tx) => {
            const existing = await this.postRepo.findById(postId, tx);

            if (!existing || existing.deletedAt) {
                throw new NotFoundException("Post not found");
            }

            if (existing.authorId !== authorId) {
                throw new ForbiddenException("Only author can edit post");
            }

            const data: { text?: string; media?: string[]; version?: { increment: 1 } } = {};
            const changed: string[] = [];

            if (dto.text !== undefined && dto.text !== existing.text) {
                data.text = dto.text;
                changed.push("text");
            }

            if (
                dto.media !== undefined &&
                JSON.stringify(dto.media) !== JSON.stringify(existing.media)
            ) {
                data.media = dto.media;
                changed.push("media");
            }

            if (changed.length === 0) {
                return existing;
            }

            data.version = { increment: 1 };

            const updated = await this.postRepo.update(postId, data, tx);

            const payload: PostUpdatedPayload = {
                postId: updated.postId,
                authorId: updated.authorId,
                text: dto.text,
                media: dto.media,
                updatedAt: updated.updatedAt.toISOString(),
                version: updated.version,
                changed,
            };

            await this.outbox.create("POST_UPDATED", payload, tx);

            return updated;
        });
    }

    async deletePost(authorId: string, postId: string) {
        return db.transaction(async (tx) => {
            const existing = await this.postRepo.findById(postId, tx);

            if (!existing || existing.deletedAt) {
                throw new NotFoundException("Post not found");
            }

            if (existing.authorId !== authorId) {
                throw new ForbiddenException("Only author can delete post");
            }

            const deletedAt = new Date();

            const updated = await this.postRepo.setDeletedAtAndIncrementVersion(
                postId,
                deletedAt,
                tx,
            );

            const payload: PostDeletedPayload = {
                postId: updated.postId,
                authorId: updated.authorId,
                deletedAt: deletedAt.toISOString(),
                version: updated.version,
            };

            await this.outbox.create("POST_DELETED", payload, tx);

            return updated;
        });
    }

    async likePost(userId: string, postId: string) {
        return db.transaction(async (tx) => {
            const post = await this.postRepo.findByIdNotDeleted(postId, tx);

            if (!post) {
                throw new NotFoundException("Post not found");
            }

            const existing = await this.likeRepo.findByPostAndUser(
                postId,
                userId,
                tx,
            );

            if (existing) {
                throw new ConflictException("Post already liked");
            }

            const like = await this.likeRepo.create(
                {
                    postId,
                    userId,
                },
                tx,
            );

            const payload: PostLikedPayload = {
                postId,
                userId,
                createdAt: like.createdAt.toISOString(),
                version: like.version,
            };

            await this.outbox.create("POST_LIKED", payload, tx);

            return like;
        });
    }

    async unlikePost(userId: string, postId: string) {
        return db.transaction(async (tx) => {
            const like = await this.likeRepo.findByPostAndUser(
                postId,
                userId,
                tx,
            );

            if (!like) {
                throw new NotFoundException("Like not found");
            }

            const version = like.version + 1;
            await this.likeRepo.delete(postId, userId, tx);

            const payload: PostUnlikedPayload = {
                postId,
                userId,
                createdAt: like.createdAt.toISOString(),
                version,
            };

            await this.outbox.create("POST_UNLIKED", payload, tx);

            return;
        });
    }

    async addComment(authorId: string, postId: string, dto: CreateCommentDto) {
        return db.transaction(async (tx) => {
            const post = await this.postRepo.findByIdNotDeleted(postId, tx);

            if (!post) {
                throw new NotFoundException("Post not found");
            }

            const comment = await this.commentRepo.create(
                {
                    postId,
                    authorId,
                    text: dto.text,
                },
                tx,
            );

            const payload: CommentCreatedPayload = {
                commentId: comment.commentId,
                postId: comment.postId,
                authorId: comment.authorId,
                text: comment.text,
                createdAt: comment.createdAt.toISOString(),
                version: comment.version,
            };

            await this.outbox.create("COMMENT_CREATED", payload, tx);

            return comment;
        });
    }

    async deleteComment(userId: string, commentId: string) {
        return db.transaction(async (tx) => {
            const comment = await this.commentRepo.findById(commentId, tx);

            if (!comment || comment.deletedAt) {
                throw new NotFoundException("Comment not found");
            }

            if (comment.authorId !== userId) {
                throw new ForbiddenException(
                    "Only comment author can delete comment",
                );
            }

            const deletedAt = new Date();

            const updated =
                await this.commentRepo.setDeletedAtAndIncrementVersion(
                    commentId,
                    deletedAt,
                    tx,
                );

            const payload: CommentDeletedPayload = {
                commentId: updated.commentId,
                postId: updated.postId,
                authorId: updated.authorId,
                deletedAt: deletedAt.toISOString(),
                version: updated.version,
            };

            await this.outbox.create("COMMENT_DELETED", payload, tx);

            return updated;
        });
    }
}
