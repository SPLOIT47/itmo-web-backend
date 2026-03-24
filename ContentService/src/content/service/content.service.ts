import {
    Injectable,
    BadRequestException,
    ConflictException,
    ForbiddenException,
    NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
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

const COMMUNITY_MOD_ROLES = new Set(["OWNER", "ADMIN", "MODERATOR"]);

@Injectable()
export class ContentService {
    constructor(
        private readonly postRepo: PostRepository,
        private readonly commentRepo: CommentRepository,
        private readonly likeRepo: LikeRepository,
        private readonly outbox: OutboxRepository,
        private readonly config: ConfigService,
    ) {}

    private async userCanDeleteCommunityPost(
        userId: string,
        communityId: string,
    ): Promise<boolean> {
        const base = this.config
            .get<string>("SOCIAL_SERVICE_URL")
            ?.trim();
        if (!base) {
            return false;
        }
        try {
            const url = `${base.replace(/\/$/, "")}/communities/${encodeURIComponent(communityId)}/members`;
            const res = await fetch(url);
            if (!res.ok) {
                return false;
            }
            const members = (await res.json()) as Array<{
                userId: string;
                role: string;
            }>;
            const row = members.find((m) => m.userId === userId);
            return (
                !!row && COMMUNITY_MOD_ROLES.has(String(row.role).toUpperCase())
            );
        } catch {
            return false;
        }
    }

    async createPost(authorId: string, dto: CreatePostDto) {
        return db.transaction(async (tx) => {
            const postAuthorKind = dto.postAuthorKind ?? "user";
            const effectiveAuthorId =
                postAuthorKind === "community"
                    ? dto.communityId
                    : authorId;

            if (!effectiveAuthorId) {
                throw new BadRequestException(
                    "communityId is required for community posts",
                );
            }

            const post = await this.postRepo.create(
                {
                    authorId: effectiveAuthorId,
                    text: dto.text,
                    media: dto.media ?? [],
                },
                tx,
            );

            const payload: PostCreatedPayload = {
                postId: post.postId,
                authorId: post.authorId,
                postAuthorKind,
                ...(postAuthorKind === "community"
                    ? { postedByUserId: authorId }
                    : {}),
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

    async listPostsByAuthor(
        authorId: string,
        limit: number,
        offset: number,
    ) {
        const rows = await this.postRepo.findActiveByAuthor(authorId, db, {
            limit,
            offset,
        });
        const postIds = rows.map((p) => p.postId);
        const [likes, comments] = await Promise.all([
            this.likeRepo.listByPostIds(postIds, db),
            this.commentRepo.listActiveByPostIds(postIds, db),
        ]);

        const likesByPost = new Map<string, string[]>();
        for (const l of likes) {
            const list = likesByPost.get(l.postId) ?? [];
            list.push(l.userId);
            likesByPost.set(l.postId, list);
        }

        const commentsByPost = new Map<
            string,
            Array<{
                id: string;
                authorId: string;
                text: string;
                createdAt: string;
                updatedAt: string;
            }>
        >();
        for (const c of comments) {
            const list = commentsByPost.get(c.postId) ?? [];
            list.push({
                id: c.commentId,
                authorId: c.authorId,
                text: c.text,
                createdAt: c.createdAt.toISOString(),
                updatedAt: c.createdAt.toISOString(),
            });
            commentsByPost.set(c.postId, list);
        }

        return rows.map((p) => ({
            postId: p.postId,
            authorId: p.authorId,
            text: p.text,
            media: p.media,
            likes: likesByPost.get(p.postId) ?? [],
            comments: commentsByPost.get(p.postId) ?? [],
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString(),
        }));
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
                const canModerate = await this.userCanDeleteCommunityPost(
                    authorId,
                    existing.authorId,
                );
                if (!canModerate) {
                    throw new ForbiddenException("Only author can delete post");
                }
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

    async deleteUserContent(userId: string): Promise<void> {
        await db.transaction(async (tx) => {
            const posts = await this.postRepo.findActiveByAuthor(userId, tx);
            for (const post of posts) {
                const deletedAt = new Date();
                const updated = await this.postRepo.setDeletedAtAndIncrementVersion(
                    post.postId,
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
            }

            const comments = await this.commentRepo.findActiveByAuthor(
                userId,
                tx,
            );
            for (const c of comments) {
                const deletedAt = new Date();
                const updated =
                    await this.commentRepo.setDeletedAtAndIncrementVersion(
                        c.commentId,
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
            }

            const likes = await this.likeRepo.listByUser(userId, tx);
            for (const like of likes) {
                const payload: PostUnlikedPayload = {
                    postId: like.postId,
                    userId,
                    createdAt: like.createdAt.toISOString(),
                    version: like.version + 1,
                };

                await this.likeRepo.delete(like.postId, userId, tx);
                await this.outbox.create("POST_UNLIKED", payload, tx);
            }
        });
    }
}
