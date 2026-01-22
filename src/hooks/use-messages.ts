'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ConversationPreview, MessageWithSender } from '@/types/social.types';
import type { SendMessageInput, SendMessageToConversationInput } from '@/schemas/social.schema';

interface ConversationsResponse {
  conversations: ConversationPreview[];
  total: number;
}

interface ConversationInfo {
  id: string;
  user1: { id: string; name: string | null; username: string | null; image: string | null };
  user2: { id: string; name: string | null; username: string | null; image: string | null };
}

interface MessagesResponse {
  messages: MessageWithSender[];
  total: number;
  hasMore: boolean;
  conversation: ConversationInfo;
}

async function fetchConversations(): Promise<ConversationsResponse> {
  const response = await fetch('/api/messages');
  if (!response.ok) {
    throw new Error('Failed to fetch conversations');
  }
  return response.json();
}

async function fetchMessages(conversationId: string, page = 1): Promise<MessagesResponse> {
  const params = new URLSearchParams({ page: page.toString() });
  const response = await fetch(`/api/messages/${conversationId}?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }
  return response.json();
}

async function sendMessage(data: SendMessageInput): Promise<MessageWithSender> {
  const response = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Failed to send message');
  }
  return response.json();
}

async function sendMessageToConversation(params: {
  conversationId: string;
  data: SendMessageToConversationInput;
}): Promise<MessageWithSender> {
  const response = await fetch(`/api/messages/${params.conversationId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error ?? 'Failed to send message');
  }
  return response.json();
}

async function markConversationRead(conversationId: string): Promise<void> {
  const response = await fetch(`/api/messages/${conversationId}/read`, {
    method: 'PUT',
  });
  if (!response.ok) {
    throw new Error('Failed to mark conversation as read');
  }
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: fetchConversations,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useMessages(conversationId: string, page = 1) {
  return useQuery({
    queryKey: ['messages', conversationId, page],
    queryFn: () => fetchMessages(conversationId, page),
    staleTime: 10 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useSendMessageToConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessageToConversation,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', variables.conversationId] });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markConversationRead,
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}
