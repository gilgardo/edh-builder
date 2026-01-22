'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useNotifications,
  useMarkNotificationsRead,
  useDeleteNotification,
} from '@/hooks';
import { NotificationItem } from './notification-item';
import type { NotificationType } from '@prisma/client';

const NOTIFICATION_TYPES: { value: NotificationType | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DECK_LIKE', label: 'Likes' },
  { value: 'DECK_REVIEW', label: 'Reviews' },
  { value: 'COLLABORATION_INVITE', label: 'Invites' },
  { value: 'NEW_FOLLOWER', label: 'Followers' },
  { value: 'NEW_MESSAGE', label: 'Messages' },
];

export function NotificationList() {
  const [activeType, setActiveType] = useState<NotificationType | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useNotifications({
    type: activeType === 'ALL' ? undefined : activeType,
    page,
    limit: 20,
  });

  const markRead = useMarkNotificationsRead();
  const deleteNotification = useDeleteNotification();

  const notifications = data?.notifications ?? [];
  const total = data?.total ?? 0;
  const unreadCount = data?.unreadCount ?? 0;
  const hasMore = notifications.length < total;

  const handleMarkRead = (id: string) => {
    markRead.mutate({ notificationIds: [id] });
  };

  const handleMarkAllRead = () => {
    markRead.mutate({ all: true });
  };

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id);
  };

  const handleTypeChange = (value: string) => {
    setActiveType(value as NotificationType | 'ALL');
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={markRead.isPending}
          >
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filters */}
      <Tabs value={activeType} onValueChange={handleTypeChange}>
        <TabsList className="w-full justify-start overflow-x-auto">
          {NOTIFICATION_TYPES.map((type) => (
            <TabsTrigger key={type.value} value={type.value}>
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Notifications List */}
      <div className="space-y-1 rounded-lg border border-border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No notifications</p>
            <p className="text-sm text-muted-foreground mt-1">
              {activeType === 'ALL'
                ? "You're all caught up!"
                : `No ${activeType.toLowerCase().replace('_', ' ')} notifications`}
            </p>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={isFetching}
          >
            {isFetching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
