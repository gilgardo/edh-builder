import type {
  Follow,
  DeckReview,
  DeckCollaborator,
  Conversation,
  Message,
  Notification,
  NotificationType,
  CollaboratorRole,
  InviteStatus,
  User,
  Deck,
} from '@prisma/client';

// Re-export Prisma enums for convenience
export type { NotificationType, CollaboratorRole, InviteStatus };

// Follow with relations
export interface FollowWithUser extends Follow {
  follower: Pick<User, 'id' | 'name' | 'username' | 'image'>;
  following: Pick<User, 'id' | 'name' | 'username' | 'image'>;
}

// Review with relations
export interface DeckReviewWithUser extends DeckReview {
  user: Pick<User, 'id' | 'name' | 'username' | 'image'>;
}

export interface DeckReviewWithDeck extends DeckReview {
  deck: Pick<Deck, 'id' | 'name'>;
}

// Collaborator with relations
export interface DeckCollaboratorWithUser extends DeckCollaborator {
  user: Pick<User, 'id' | 'name' | 'username' | 'image'>;
}

export interface DeckCollaboratorWithDeck extends DeckCollaborator {
  deck: Pick<Deck, 'id' | 'name'>;
}

// Conversation with relations
export interface ConversationWithParticipants extends Conversation {
  user1: Pick<User, 'id' | 'name' | 'username' | 'image'>;
  user2: Pick<User, 'id' | 'name' | 'username' | 'image'>;
  messages: Message[];
}

export interface ConversationPreview extends Conversation {
  user1: Pick<User, 'id' | 'name' | 'username' | 'image'>;
  user2: Pick<User, 'id' | 'name' | 'username' | 'image'>;
  lastMessage?: Message;
  unreadCount: number;
}

// Message with sender
export interface MessageWithSender extends Message {
  sender: Pick<User, 'id' | 'name' | 'username' | 'image'>;
}

// Notification data payloads by type
export interface NotificationDataDeckLike {
  deckId: string;
  deckName: string;
  likerId: string;
  likerName: string;
}

export interface NotificationDataDeckReview {
  deckId: string;
  deckName: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
}

export interface NotificationDataCollaborationInvite {
  deckId: string;
  deckName: string;
  inviterId: string;
  inviterName: string;
  role: CollaboratorRole;
}

export interface NotificationDataCollaborationAccepted {
  deckId: string;
  deckName: string;
  accepterId: string;
  accepterName: string;
}

export interface NotificationDataNewFollower {
  followerId: string;
  followerName: string;
}

export interface NotificationDataNewMessage {
  conversationId: string;
  senderId: string;
  senderName: string;
  messagePreview: string;
}

export type NotificationData =
  | NotificationDataDeckLike
  | NotificationDataDeckReview
  | NotificationDataCollaborationInvite
  | NotificationDataCollaborationAccepted
  | NotificationDataNewFollower
  | NotificationDataNewMessage;

// Typed notification
export interface TypedNotification extends Omit<Notification, 'data'> {
  data: NotificationData | null;
}

// User profile with social stats
export interface UserProfile extends Pick<User, 'id' | 'name' | 'username' | 'bio' | 'image' | 'createdAt'> {
  followerCount: number;
  followingCount: number;
  deckCount: number;
  isFollowing?: boolean;
}
