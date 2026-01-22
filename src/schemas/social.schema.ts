import { z } from 'zod';

// ============================================
// Follow Schemas
// ============================================

export const FollowUserSchema = z.object({
  userId: z.string().cuid(),
});

export type FollowUserInput = z.infer<typeof FollowUserSchema>;

// ============================================
// Review Schemas
// ============================================

export const CreateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().max(2000).optional(),
});

export const UpdateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(100).optional(),
  content: z.string().max(2000).optional(),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewInput = z.infer<typeof UpdateReviewSchema>;

// ============================================
// Collaboration Schemas
// ============================================

export const InviteCollaboratorSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(['VIEWER', 'EDITOR', 'ADMIN']),
});

export const UpdateCollaboratorSchema = z.object({
  role: z.enum(['VIEWER', 'EDITOR', 'ADMIN']).optional(),
  status: z.enum(['ACCEPTED', 'DECLINED']).optional(),
});

export type InviteCollaboratorInput = z.infer<typeof InviteCollaboratorSchema>;
export type UpdateCollaboratorInput = z.infer<typeof UpdateCollaboratorSchema>;

// ============================================
// Message Schemas
// ============================================

export const SendMessageSchema = z.object({
  recipientId: z.string().cuid(),
  content: z.string().min(1).max(5000),
});

export const SendMessageToConversationSchema = z.object({
  content: z.string().min(1).max(5000),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type SendMessageToConversationInput = z.infer<typeof SendMessageToConversationSchema>;

// ============================================
// Notification Schemas
// ============================================

export const NotificationFiltersSchema = z.object({
  type: z
    .enum([
      'DECK_LIKE',
      'DECK_REVIEW',
      'COLLABORATION_INVITE',
      'COLLABORATION_ACCEPTED',
      'NEW_FOLLOWER',
      'NEW_MESSAGE',
    ])
    .optional(),
  unreadOnly: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
});

export const MarkNotificationsReadSchema = z.object({
  notificationIds: z.array(z.string().cuid()).optional(),
  all: z.boolean().optional(),
});

export type NotificationFiltersInput = z.infer<typeof NotificationFiltersSchema>;
export type MarkNotificationsReadInput = z.infer<typeof MarkNotificationsReadSchema>;
