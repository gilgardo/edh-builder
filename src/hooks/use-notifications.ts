'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotificationType } from '@prisma/client';
import type { TypedNotification } from '@/types/social.types';

interface NotificationsResponse {
  notifications: TypedNotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

interface NotificationFilters {
  type?: NotificationType;
  unreadOnly?: boolean;
  page?: number;
  limit?: number;
}

async function fetchNotifications(filters: NotificationFilters): Promise<NotificationsResponse> {
  const params = new URLSearchParams();

  if (filters.type) params.set('type', filters.type);
  if (filters.unreadOnly) params.set('unreadOnly', 'true');
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());

  const response = await fetch(`/api/notifications?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }
  return response.json();
}

async function fetchUnreadCount(): Promise<{ count: number }> {
  const response = await fetch('/api/notifications/unread-count');
  if (!response.ok) {
    throw new Error('Failed to fetch unread count');
  }
  return response.json();
}

async function markAsRead(params: { notificationIds?: string[]; all?: boolean }): Promise<{ count: number }> {
  const response = await fetch('/api/notifications/read', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error('Failed to mark notifications as read');
  }
  return response.json();
}

async function deleteNotification(notificationId: string): Promise<void> {
  const response = await fetch(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete notification');
  }
}

export function useNotifications(filters: NotificationFilters = {}) {
  return useQuery({
    queryKey: ['notifications', filters],
    queryFn: () => fetchNotifications(filters),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
