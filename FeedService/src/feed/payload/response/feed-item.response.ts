export type FeedItemPayload = {
    text: string | undefined;
    media: string[] | undefined;
    likeCount?: number;
    commentCount?: number;
};

export class FeedItemResponseDto {
    postId!: string;
    authorType!: "user" | "community";
    authorId!: string;
    createdAt!: string;
    payload!: FeedItemPayload;
}

