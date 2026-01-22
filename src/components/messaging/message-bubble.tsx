'use client';

import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { MessageWithSender } from '@/types/social.types';

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwnMessage: boolean;
  showAvatar?: boolean;
}

export function MessageBubble({ message, isOwnMessage, showAvatar = true }: MessageBubbleProps) {
  const initials = message.sender.name
    ? message.sender.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : message.sender.username?.slice(0, 2).toUpperCase() ?? '?';

  return (
    <div
      className={cn(
        'flex gap-2 max-w-[80%]',
        isOwnMessage ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {showAvatar && !isOwnMessage && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage
            src={message.sender.image ?? undefined}
            alt={message.sender.name ?? message.sender.username ?? 'User'}
          />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      )}

      <div className={cn('space-y-1', isOwnMessage && 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2 text-sm',
            isOwnMessage
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted rounded-bl-sm'
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <p
          className={cn(
            'text-[10px] text-muted-foreground px-1',
            isOwnMessage && 'text-right'
          )}
        >
          {format(new Date(message.createdAt), 'p')}
        </p>
      </div>
    </div>
  );
}
