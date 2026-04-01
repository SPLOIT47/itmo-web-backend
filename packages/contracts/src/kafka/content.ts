export enum ContentEventType {
    POST_CREATED = "POST_CREATED",
    POST_UPDATED = "POST_UPDATED",
    POST_DELETED = "POST_DELETED",
    POST_LIKED = "POST_LIKED",
    POST_UNLIKED = "POST_UNLIKED",
    COMMENT_CREATED = "COMMENT_CREATED",
    COMMENT_DELETED = "COMMENT_DELETED",
}

export type ContentEventEnvelope<TType extends ContentEventType, TPayload> = {
    eventId: string;
    eventType: TType;
    payload: TPayload;
    createdAt: string;
};


export type PostAuthorKind = "user" | "community";

export type PostCreatedPayload = {
    postId: string;
    authorId: string;
    postAuthorKind?: PostAuthorKind;
    postedByUserId?: string;
    text: string;
    media: string[];
    createdAt: string;
    version: number;
};

export type PostUpdatedPayload = {
    postId: string;
    authorId: string;
    text?: string;
    media?: string[];
    updatedAt: string;
    version: number;
    changed: string[];
};

export type PostDeletedPayload = {
    postId: string;
    authorId: string;
    deletedAt: string;
    version: number;
};

export type PostLikedPayload = {
    postId: string;
    userId: string;
    createdAt: string;
    version: number;
};

export type PostUnlikedPayload = {
    postId: string;
    userId: string;
    createdAt: string;
    version: number;
};

export type CommentCreatedPayload = {
    commentId: string;
    postId: string;
    authorId: string;
    text: string;
    createdAt: string;
    version: number;
};

export type CommentDeletedPayload = {
    commentId: string;
    postId: string;
    authorId: string;
    deletedAt: string;
    version: number;
};

export type PostCreatedEvent = ContentEventEnvelope<
    ContentEventType.POST_CREATED,
    PostCreatedPayload
>;

export type PostUpdatedEvent = ContentEventEnvelope<
    ContentEventType.POST_UPDATED,
    PostUpdatedPayload
>;

export type PostDeletedEvent = ContentEventEnvelope<
    ContentEventType.POST_DELETED,
    PostDeletedPayload
>;

export type PostLikedEvent = ContentEventEnvelope<
    ContentEventType.POST_LIKED,
    PostLikedPayload
>;

export type PostUnlikedEvent = ContentEventEnvelope<
    ContentEventType.POST_UNLIKED,
    PostUnlikedPayload
>;

export type CommentCreatedEvent = ContentEventEnvelope<
    ContentEventType.COMMENT_CREATED,
    CommentCreatedPayload
>;

export type CommentDeletedEvent = ContentEventEnvelope<
    ContentEventType.COMMENT_DELETED,
    CommentDeletedPayload
>;

export type ContentEvent =
    | PostCreatedEvent
    | PostUpdatedEvent
    | PostDeletedEvent
    | PostLikedEvent
    | PostUnlikedEvent
    | CommentCreatedEvent
    | CommentDeletedEvent;

export function isPostCreatedEvent(e: ContentEvent): e is PostCreatedEvent {
    return e.eventType === ContentEventType.POST_CREATED;
}

export function isPostUpdatedEvent(e: ContentEvent): e is PostUpdatedEvent {
    return e.eventType === ContentEventType.POST_UPDATED;
}

export function isPostDeletedEvent(e: ContentEvent): e is PostDeletedEvent {
    return e.eventType === ContentEventType.POST_DELETED;
}

