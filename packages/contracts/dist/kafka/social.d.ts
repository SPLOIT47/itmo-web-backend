export declare enum SocialEventType {
    FRIEND_ADDED = "FRIEND_ADDED",
    FRIEND_REMOVED = "FRIEND_REMOVED",
    COMMUNITY_SUBSCRIBED = "COMMUNITY_SUBSCRIBED",
    COMMUNITY_UNSUBSCRIBED = "COMMUNITY_UNSUBSCRIBED"
}
export type SocialEventEnvelope<TType extends SocialEventType, TPayload> = {
    eventId: string;
    eventType: TType;
    payload: TPayload;
    createdAt: string;
};
export type FriendAddedPayload = {
    userId: string;
    friendId: string;
    createdAt: string;
    version: number;
};
export type FriendRemovedPayload = {
    userId: string;
    friendId: string;
    createdAt: string;
    version: number;
};
export type CommunitySubscribedPayload = {
    userId: string;
    communityId: string;
    createdAt: string;
    version: number;
};
export type CommunityUnsubscribedPayload = {
    userId: string;
    communityId: string;
    createdAt: string;
    version: number;
};
export type FriendAddedEvent = SocialEventEnvelope<SocialEventType.FRIEND_ADDED, FriendAddedPayload>;
export type FriendRemovedEvent = SocialEventEnvelope<SocialEventType.FRIEND_REMOVED, FriendRemovedPayload>;
export type CommunitySubscribedEvent = SocialEventEnvelope<SocialEventType.COMMUNITY_SUBSCRIBED, CommunitySubscribedPayload>;
export type CommunityUnsubscribedEvent = SocialEventEnvelope<SocialEventType.COMMUNITY_UNSUBSCRIBED, CommunityUnsubscribedPayload>;
export type SocialEvent = FriendAddedEvent | FriendRemovedEvent | CommunitySubscribedEvent | CommunityUnsubscribedEvent;
