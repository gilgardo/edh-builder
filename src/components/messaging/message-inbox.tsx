'use client';

import { formatDistanceToNow } from 'date-fns';
import { Loader2, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useConversations } from '@/hooks/use-messages';
import { cn } from '@/lib/utils';
import type { ConversationPreview } from '@/types/social.types';

export function MessageInbox() {
  const { data: session } = useSession();
  const { data, isLoading } = useConversations();

  const conversations = data?.conversations ?? [];
  const currentUserId = session?.user?.id;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Start a conversation from a user profile
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ConversationItemProps {
  conversation: ConversationPreview;
  currentUserId?: string;
}

function ConversationItem({ conversation, currentUserId }: ConversationItemProps) {
  const otherUser =
    conversation.participant1 === currentUserId ? conversation.user2 : conversation.user1;

  const initials = otherUser.name
    ? otherUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : otherUser.username?.slice(0, 2).toUpperCase() ?? '?';

  const hasUnread = conversation.unreadCount > 0;

  return (
    <Link
      href={`/messages/${conversation.id}` as Route}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-muted',
        hasUnread && 'bg-muted/50'
      )}
    >
      <Avatar className="h-12 w-12">
        <AvatarImage
          src={otherUser.image ?? undefined}
          alt={otherUser.name ?? otherUser.username ?? 'User'}
        />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('font-medium truncate', hasUnread && 'font-semibold')}>
            {otherUser.name ?? otherUser.username}
          </p>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true })}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          {conversation.lastMessage ? (
            <p
              className={cn(
                'text-sm truncate',
                hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}
            >
              {conversation.lastMessage.senderId === currentUserId && 'You: '}
              {conversation.lastMessage.content}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No messages yet</p>
          )}

          {hasUnread && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground shrink-0">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
