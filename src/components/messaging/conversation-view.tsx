'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import type { Route } from 'next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageBubble } from './message-bubble';
import { MessageInput } from './message-input';
import { useMessages, useSendMessageToConversation, useMarkConversationRead } from '@/hooks/use-messages';
import type { ConversationPreview } from '@/types/social.types';

interface ConversationViewProps {
  conversation: ConversationPreview;
}

export function ConversationView({ conversation }: ConversationViewProps) {
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching } = useMessages(conversation.id);
  const sendMessage = useSendMessageToConversation();
  const markRead = useMarkConversationRead();

  const messages = data?.messages ?? [];
  const currentUserId = session?.user?.id;

  // Determine the other user in the conversation
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

  // Mark conversation as read when opened
  useEffect(() => {
    if (conversation.unreadCount > 0) {
      markRead.mutate(conversation.id);
    }
  }, [conversation.id, conversation.unreadCount, markRead]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (content: string) => {
    await sendMessage.mutateAsync({
      conversationId: conversation.id,
      data: { content },
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Link href={`/users/${otherUser.id}` as Route}>
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={otherUser.image ?? undefined}
              alt={otherUser.name ?? otherUser.username ?? 'User'}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Link>
        <div>
          <Link href={`/users/${otherUser.id}` as Route} className="font-medium hover:underline">
            {otherUser.name ?? otherUser.username}
          </Link>
          {otherUser.username && otherUser.name && (
            <p className="text-sm text-muted-foreground">@{otherUser.username}</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          <>
            {isFetching && (
              <div className="flex justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {/* Messages are displayed in reverse order (newest at bottom) */}
            {[...messages].reverse().map((message, index, arr) => {
              const prevMessage = arr[index - 1];
              const showAvatar =
                !prevMessage || prevMessage.senderId !== message.senderId;

              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.senderId === currentUserId}
                  showAvatar={showAvatar}
                />
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <MessageInput onSend={handleSend} isLoading={sendMessage.isPending} />
      </div>
    </div>
  );
}
