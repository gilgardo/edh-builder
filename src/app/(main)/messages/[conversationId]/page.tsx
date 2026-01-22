'use client';

import { use, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import type { Route } from 'next';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/layout/container';
import { MessageBubble, MessageInput } from '@/components/messaging';
import {
  useMessages,
  useSendMessageToConversation,
  useMarkConversationRead,
} from '@/hooks/use-messages';

interface PageProps {
  params: Promise<{ conversationId: string }>;
}

export default function ConversationPage({ params }: PageProps) {
  const { conversationId } = use(params);
  const { data: session, status } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, isFetching } = useMessages(conversationId);
  const sendMessage = useSendMessageToConversation();
  const markRead = useMarkConversationRead();

  const messages = data?.messages ?? [];
  const conversation = data?.conversation;
  const currentUserId = session?.user?.id;

  // Determine the other user in the conversation
  const otherUser =
    conversation && currentUserId
      ? conversation.user1.id === currentUserId
        ? conversation.user2
        : conversation.user1
      : null;

  const initials = otherUser?.name
    ? otherUser.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : otherUser?.username?.slice(0, 2).toUpperCase() ?? '?';

  // Mark conversation as read when opened
  useEffect(() => {
    if (conversationId && currentUserId) {
      markRead.mutate(conversationId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, currentUserId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (content: string) => {
    await sendMessage.mutateAsync({
      conversationId,
      data: { content },
    });
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="py-8">
        <Container className="max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-4 w-24 bg-muted rounded" />
            </div>
            <Card className="h-[600px]">
              <div className="p-4 border-b border-border flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="h-5 w-32 bg-muted rounded" />
              </div>
              <div className="flex items-center justify-center h-[500px]">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            </Card>
          </div>
        </Container>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="py-8">
        <Container className="max-w-3xl">
          <div className="py-12 text-center">
            <h1 className="text-2xl font-bold">Sign in required</h1>
            <p className="text-muted-foreground mt-2">
              You need to be signed in to view messages.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Sign in
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  if (!conversation || !otherUser) {
    return (
      <div className="py-8">
        <Container className="max-w-3xl">
          <div className="mb-6">
            <Link
              href="/messages"
              className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Messages
            </Link>
          </div>
          <div className="py-12 text-center">
            <h1 className="text-2xl font-bold">Conversation not found</h1>
            <p className="text-muted-foreground mt-2">
              This conversation may have been deleted or you don&apos;t have access.
            </p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8">
      <Container className="max-w-3xl">
        <div className="mb-6">
          <Link
            href="/messages"
            className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Messages
          </Link>
        </div>

        <Card className="flex flex-col h-[600px]">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
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
              <Link
                href={`/users/${otherUser.id}` as Route}
                className="font-medium hover:underline"
              >
                {otherUser.name ?? otherUser.username}
              </Link>
              {otherUser.username && otherUser.name && (
                <p className="text-sm text-muted-foreground">@{otherUser.username}</p>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
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
                {messages.map((message, index) => {
                  const prevMessage = messages[index - 1];
                  const showAvatar = !prevMessage || prevMessage.senderId !== message.senderId;

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
          <div className="p-4 border-t border-border shrink-0">
            <MessageInput onSend={handleSend} isLoading={sendMessage.isPending} />
          </div>
        </Card>
      </Container>
    </div>
  );
}
