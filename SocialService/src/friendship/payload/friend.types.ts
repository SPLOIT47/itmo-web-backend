export const FriendRequestStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  CANCELED: 'CANCELED',
} as const;

export type FriendRequestStatus = (typeof FriendRequestStatus)[keyof typeof FriendRequestStatus];

export type FriendRelationType = 'none' | 'outgoing' | 'incoming' | 'friends' | 'self';

