import { FeedRepository } from "../../feed/repository/feed.repository";
import { FeedSourceRepository } from "../../feed/repository/feed-source.repository";
import { InboxRepository } from "../../inbox/repository/inbox.repository";
import { ContentEvent } from "@app/contracts/kafka/content";
export declare class ApplyContentEventUseCase {
    private readonly inboxRepository;
    private readonly feedRepository;
    private readonly feedSourceRepository;
    private readonly log;
    constructor(inboxRepository: InboxRepository, feedRepository: FeedRepository, feedSourceRepository: FeedSourceRepository);
    handle(event: ContentEvent): Promise<void>;
    private fetchCommunityOwnerUserId;
    private handlePostCreated;
    private handlePostUpdated;
    private handlePostDeleted;
    private handlePostLiked;
    private handlePostUnliked;
    private handleCommentCreated;
    private handleCommentDeleted;
}
