'use client';

import { formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { FollowButton } from './follow-button';
import { UserStats } from './user-stats';
import type { UserProfile } from '@/types/social.types';
import { CalendarDays } from 'lucide-react';

interface UserProfileHeaderProps {
  user: UserProfile;
  isOwnProfile?: boolean;
}

export function UserProfileHeader({ user, isOwnProfile = false }: UserProfileHeaderProps) {
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.username?.slice(0, 2).toUpperCase() ?? '?';

  return (
    <div className="relative">
      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 rounded-t-lg" />

      {/* Profile Info */}
      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? user.username ?? 'User'} />
            <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Name and Bio */}
          <div className="space-y-2">
            <div>
              <h1 className="text-2xl font-bold">{user.name ?? user.username}</h1>
              {user.username && user.name && (
                <p className="text-muted-foreground">@{user.username}</p>
              )}
            </div>

            {user.bio && (
              <p className="text-sm text-foreground max-w-xl">{user.bio}</p>
            )}

            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span>Joined {formatDate(user.createdAt)}</span>
            </div>
          </div>

          {/* Follow Button */}
          {!isOwnProfile && <FollowButton userId={user.id} />}
        </div>

        {/* Stats */}
        <div className="mt-6">
          <UserStats
            userId={user.id}
            followerCount={user.followerCount}
            followingCount={user.followingCount}
            deckCount={user.deckCount}
          />
        </div>
      </div>
    </div>
  );
}

export function UserProfileHeaderSkeleton() {
  return (
    <div className="relative">
      <div className="h-32 bg-muted rounded-t-lg" />
      <div className="px-6 pb-6">
        <div className="relative -mt-16 mb-4">
          <Skeleton className="h-32 w-32 rounded-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-full max-w-xl" />
          <div className="flex gap-6 mt-6">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
