'use client';

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import type { Route } from 'next';
import {
  Heart,
  Star,
  UserPlus,
  Users,
  MessageCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { TypedNotification, NotificationData } from '@/types/social.types';
import type { NotificationType } from '@prisma/client';

interface NotificationItemProps {
  notification: TypedNotification;
  onMarkRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}

const notificationConfig: Record<
  NotificationType,
  { icon: typeof Heart; color: string; bgColor: string }
> = {
  DECK_LIKE: {
    icon: Heart,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
  DECK_REVIEW: {
    icon: Star,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
  },
  COLLABORATION_INVITE: {
    icon: UserPlus,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  COLLABORATION_ACCEPTED: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  NEW_FOLLOWER: {
    icon: Users,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  NEW_MESSAGE: {
    icon: MessageCircle,
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
  },
};

function getNotificationLink(notification: TypedNotification): string | null {
  const data = notification.data as NotificationData | null;
  if (!data) return null;

  switch (notification.type) {
    case 'DECK_LIKE':
    case 'DECK_REVIEW':
    case 'COLLABORATION_INVITE':
    case 'COLLABORATION_ACCEPTED':
      return 'deckId' in data ? `/decks/${data.deckId}` : null;
    case 'NEW_FOLLOWER':
      return 'followerId' in data ? `/users/${data.followerId}` : null;
    case 'NEW_MESSAGE':
      return 'conversationId' in data ? `/messages/${data.conversationId}` : null;
    default:
      return null;
  }
}

function getActorImage(_notification: TypedNotification): string | null {
  // In a real app, you might store avatar URLs in notification data
  return null;
}

function getActorName(notification: TypedNotification): string {
  const data = notification.data as NotificationData | null;
  if (!data) return 'Someone';

  if ('likerName' in data) return data.likerName;
  if ('reviewerName' in data) return data.reviewerName;
  if ('inviterName' in data) return data.inviterName;
  if ('accepterName' in data) return data.accepterName;
  if ('followerName' in data) return data.followerName;
  if ('senderName' in data) return data.senderName;

  return 'Someone';
}

export function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  compact = false,
}: NotificationItemProps) {
  const config = notificationConfig[notification.type];
  const Icon = config.icon;
  const link = getNotificationLink(notification);
  const actorName = getActorName(notification);
  const actorImage = getActorImage(notification);
  const isUnread = !notification.readAt;

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors',
        isUnread ? 'bg-muted/50' : 'bg-transparent',
        link && 'hover:bg-muted cursor-pointer'
      )}
    >
      {/* Icon */}
      <div className={cn('rounded-full p-2 shrink-0', config.bgColor)}>
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {!compact && (
              <Avatar className="h-6 w-6">
                <AvatarImage src={actorImage ?? undefined} alt={actorName} />
                <AvatarFallback className="text-xs">
                  {actorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <p className={cn('text-sm', isUnread && 'font-medium')}>
              {notification.title}
            </p>
          </div>
          {isUnread && (
            <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
        </div>

        {notification.message && !compact && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>
        )}

        <p className="text-xs text-muted-foreground mt-1">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Actions */}
      {!compact && (onMarkRead || onDelete) && (
        <div className="flex items-center gap-1 shrink-0">
          {onMarkRead && isUnread && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onMarkRead(notification.id);
              }}
            >
              <CheckCircle className="h-4 w-4" />
              <span className="sr-only">Mark as read</span>
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(notification.id);
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (link) {
    return (
      <Link href={link as Route} onClick={() => isUnread && onMarkRead?.(notification.id)}>
        {content}
      </Link>
    );
  }

  return content;
}
