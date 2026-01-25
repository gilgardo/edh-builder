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
import { Badge } from '@/components/ui/badge';
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
  {
    icon: typeof Heart;
    color: string;
    bgColor: string;
    borderColor: string;
    label: string;
  }
> = {
  DECK_LIKE: {
    icon: Heart,
    color: 'text-rose-500',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-l-rose-500',
    label: 'Like',
  },
  DECK_REVIEW: {
    icon: Star,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-l-amber-500',
    label: 'Review',
  },
  COLLABORATION_INVITE: {
    icon: UserPlus,
    color: 'text-sky-500',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-l-sky-500',
    label: 'Invite',
  },
  COLLABORATION_ACCEPTED: {
    icon: CheckCircle,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-l-emerald-500',
    label: 'Accepted',
  },
  NEW_FOLLOWER: {
    icon: Users,
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-l-violet-500',
    label: 'Follower',
  },
  NEW_MESSAGE: {
    icon: MessageCircle,
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-l-teal-500',
    label: 'Message',
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
        'relative flex items-start gap-3 p-3 rounded-lg transition-all duration-200',
        'border-l-2',
        isUnread ? [config.borderColor, 'bg-muted/40'] : ['border-l-transparent', 'bg-transparent'],
        link && 'hover:bg-muted/60 cursor-pointer hover:shadow-sm'
      )}
    >
      {/* Icon with animated ring for unread */}
      <div className={cn('relative rounded-full p-2 shrink-0 transition-colors', config.bgColor)}>
        <Icon className={cn('h-4 w-4', config.color)} />
        {isUnread && (
          <span
            className={cn(
              'absolute inset-0 rounded-full animate-ping opacity-30',
              config.bgColor
            )}
            style={{ animationDuration: '2s', animationIterationCount: '1' }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {!compact && (
              <Avatar className="h-6 w-6 ring-2 ring-background">
                <AvatarImage src={actorImage ?? undefined} alt={actorName} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {actorName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <p className={cn('text-sm', isUnread && 'font-medium text-foreground')}>
              {notification.title}
            </p>
            {compact && (
              <Badge variant="muted" size="sm" className="ml-1">
                {config.label}
              </Badge>
            )}
          </div>
          {isUnread && !compact && (
            <Badge variant="default" size="sm" dot className="shrink-0">
              New
            </Badge>
          )}
        </div>

        {notification.message && !compact && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {notification.message}
          </p>
        )}

        <p className="text-xs text-muted-foreground mt-1.5">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>

      {/* Actions */}
      {!compact && (onMarkRead || onDelete) && (
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {onMarkRead && isUnread && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
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
              size="icon-sm"
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
      <Link
        href={link as Route}
        onClick={() => isUnread && onMarkRead?.(notification.id)}
        className="group block"
      >
        {content}
      </Link>
    );
  }

  return <div className="group">{content}</div>;
}
