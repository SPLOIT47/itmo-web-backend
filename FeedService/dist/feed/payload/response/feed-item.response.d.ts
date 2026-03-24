export type FeedCommentDto = {
    id: string;
    authorId: string;
    text: string;
    createdAt: string;
    updatedAt: string;
};
export type FeedItemPayload = {
    text: string | undefined;
    media: string[] | undefined;
    likes: string[];
    comments: FeedCommentDto[];
};
export declare class FeedItemResponseDto {
    postId: string;
    authorType: "user" | "community";
    authorId: string;
    createdAt: string;
    payload: FeedItemPayload;
}
