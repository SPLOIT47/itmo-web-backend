import { ConfigService } from "@nestjs/config";
import { FeedSourceRepository } from "../../feed/repository/feed-source.repository";
import { FeedRepository } from "../../feed/repository/feed.repository";
import { InboxRepository } from "../../inbox/repository/inbox.repository";
import { SocialEvent } from "@app/contracts/kafka/social";
export declare class ApplySocialEventUseCase {
    private readonly inboxRepository;
    private readonly feedSourceRepository;
    private readonly feedRepository;
    private readonly config;
    private readonly log;
    constructor(inboxRepository: InboxRepository, feedSourceRepository: FeedSourceRepository, feedRepository: FeedRepository, config: ConfigService);
    handle(event: SocialEvent): Promise<void>;
    private backfillFriendPostsFromContent;
    private backfillCommunityPostsFromContent;
    private handleFriendAdded;
    private handleFriendRemoved;
    private handleCommunitySubscribed;
    private handleCommunityUnsubscribed;
}
