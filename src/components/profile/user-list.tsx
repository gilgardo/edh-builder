'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FollowButton } from './follow-button';
import { useSession } from 'next-auth/react';
import type { UserProfile } from '@/types/social.types';

interface UserListProps {
  users: UserProfile[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function UserList({ users, isLoading, emptyMessage = 'No users found' }: UserListProps) {
  const { data: session } = useSession();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (users.length === 0) {
    return <div className="py-8 text-center text-muted-foreground">{emptyMessage}</div>;
  }

  return (
    <div className="space-y-2">
      {users.map((user) => {
        const initials =
          user.name?.slice(0, 2).toUpperCase() ?? user.username?.slice(0, 2).toUpperCase() ?? '?';
        const isOwnUser = session?.user?.id === user.id;

        return (
          <div
            key={user.id}
            className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
          >
            <Link
              href={`/users/${user.id}` as Route}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={user.image ?? undefined}
                  alt={user.name ?? user.username ?? 'User'}
                />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium hover:underline">
                  {user.name ?? user.username}
                </p>
                {user.username && user.name && (
                  <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
                )}
              </div>
            </Link>
            {!isOwnUser && <FollowButton userId={user.id} size="sm" />}
          </div>
        );
      })}
    </div>
  );
}
