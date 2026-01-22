import { prisma } from '@/lib/prisma';
import type { NotificationType, CollaboratorRole } from '@prisma/client';
import type {
  NotificationDataDeckLike,
  NotificationDataDeckReview,
  NotificationDataCollaborationInvite,
  NotificationDataCollaborationAccepted,
  NotificationDataNewFollower,
  NotificationDataNewMessage,
  TypedNotification,
} from '@/types/social.types';

// ============================================
// Notification Creation Functions
// ============================================

/**
 * Create a notification when someone likes a deck
 */
export async function notifyDeckLike(params: {
  deckOwnerId: string;
  deckId: string;
  deckName: string;
  likerId: string;
  likerName: string;
}): Promise<void> {
  // Don't notify if user likes their own deck
  if (params.deckOwnerId === params.likerId) return;

  const data: NotificationDataDeckLike = {
    deckId: params.deckId,
    deckName: params.deckName,
    likerId: params.likerId,
    likerName: params.likerName,
  };

  await createNotification({
    userId: params.deckOwnerId,
    type: 'DECK_LIKE',
    title: `${params.likerName} liked your deck`,
    message: `"${params.deckName}" received a new like`,
    data,
  });
}

/**
 * Create a notification when someone reviews a deck
 */
export async function notifyDeckReview(params: {
  deckOwnerId: string;
  deckId: string;
  deckName: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
}): Promise<void> {
  // Don't notify if user reviews their own deck
  if (params.deckOwnerId === params.reviewerId) return;

  const data: NotificationDataDeckReview = {
    deckId: params.deckId,
    deckName: params.deckName,
    reviewerId: params.reviewerId,
    reviewerName: params.reviewerName,
    rating: params.rating,
  };

  const stars = '★'.repeat(params.rating) + '☆'.repeat(5 - params.rating);

  await createNotification({
    userId: params.deckOwnerId,
    type: 'DECK_REVIEW',
    title: `${params.reviewerName} reviewed your deck`,
    message: `"${params.deckName}" received a ${stars} review`,
    data,
  });
}

/**
 * Create a notification when someone is invited to collaborate
 */
export async function notifyCollaborationInvite(params: {
  inviteeId: string;
  deckId: string;
  deckName: string;
  inviterId: string;
  inviterName: string;
  role: CollaboratorRole;
}): Promise<void> {
  const data: NotificationDataCollaborationInvite = {
    deckId: params.deckId,
    deckName: params.deckName,
    inviterId: params.inviterId,
    inviterName: params.inviterName,
    role: params.role,
  };

  const roleText = params.role.toLowerCase();

  await createNotification({
    userId: params.inviteeId,
    type: 'COLLABORATION_INVITE',
    title: `${params.inviterName} invited you to collaborate`,
    message: `You've been invited as ${roleText} on "${params.deckName}"`,
    data,
  });
}

/**
 * Create a notification when someone accepts a collaboration invite
 */
export async function notifyCollaborationAccepted(params: {
  inviterId: string;
  deckId: string;
  deckName: string;
  accepterId: string;
  accepterName: string;
}): Promise<void> {
  const data: NotificationDataCollaborationAccepted = {
    deckId: params.deckId,
    deckName: params.deckName,
    accepterId: params.accepterId,
    accepterName: params.accepterName,
  };

  await createNotification({
    userId: params.inviterId,
    type: 'COLLABORATION_ACCEPTED',
    title: `${params.accepterName} accepted your invitation`,
    message: `They are now a collaborator on "${params.deckName}"`,
    data,
  });
}

/**
 * Create a notification when someone follows a user
 */
export async function notifyNewFollower(params: {
  followedUserId: string;
  followerId: string;
  followerName: string;
}): Promise<void> {
  const data: NotificationDataNewFollower = {
    followerId: params.followerId,
    followerName: params.followerName,
  };

  await createNotification({
    userId: params.followedUserId,
    type: 'NEW_FOLLOWER',
    title: `${params.followerName} started following you`,
    message: 'You have a new follower!',
    data,
  });
}

/**
 * Create a notification for a new message
 */
export async function notifyNewMessage(params: {
  recipientId: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  messageContent: string;
}): Promise<void> {
  // Don't notify yourself
  if (params.recipientId === params.senderId) return;

  const messagePreview =
    params.messageContent.length > 100
      ? params.messageContent.substring(0, 100) + '...'
      : params.messageContent;

  const data: NotificationDataNewMessage = {
    conversationId: params.conversationId,
    senderId: params.senderId,
    senderName: params.senderName,
    messagePreview,
  };

  await createNotification({
    userId: params.recipientId,
    type: 'NEW_MESSAGE',
    title: `New message from ${params.senderName}`,
    message: messagePreview,
    data,
  });
}

// ============================================
// Core Notification Operations
// ============================================

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message?: string;
  data?: object;
}

/**
 * Create a notification in the database
 */
async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data as object | undefined,
      },
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

/**
 * Get notifications for a user with pagination
 */
export async function getNotifications(params: {
  userId: string;
  type?: NotificationType;
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}): Promise<{ notifications: TypedNotification[]; total: number; unreadCount: number }> {
  const { userId, type, unreadOnly = false, page = 1, limit = 20 } = params;

  const where = {
    userId,
    ...(type && { type }),
    ...(unreadOnly && { readAt: null }),
  };

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return {
    notifications: notifications as TypedNotification[],
    total,
    unreadCount,
  };
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

/**
 * Mark notifications as read
 */
export async function markNotificationsRead(params: {
  userId: string;
  notificationIds?: string[];
  all?: boolean;
}): Promise<number> {
  const { userId, notificationIds, all = false } = params;

  if (all) {
    const result = await prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return result.count;
  }

  if (notificationIds && notificationIds.length > 0) {
    const result = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return result.count;
  }

  return 0;
}

/**
 * Delete a notification
 */
export async function deleteNotification(params: {
  userId: string;
  notificationId: string;
}): Promise<boolean> {
  const { userId, notificationId } = params;

  const result = await prisma.notification.deleteMany({
    where: { id: notificationId, userId },
  });

  return result.count > 0;
}

/**
 * Delete old read notifications (cleanup job)
 */
export async function cleanupOldNotifications(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.notification.deleteMany({
    where: {
      readAt: { not: null },
      createdAt: { lt: cutoffDate },
    },
  });

  return result.count;
}
