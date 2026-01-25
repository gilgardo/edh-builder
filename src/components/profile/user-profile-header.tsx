'use client';

import { useState } from 'react';
import { CalendarDays, Mail, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FollowButton } from './follow-button';
import { UserStats } from './user-stats';
import { NewMessageDialog } from '@/components/messaging';
import type { UserProfile } from '@/types/social.types';

interface UserProfileHeaderProps {
  user: UserProfile;
  isOwnProfile?: boolean;
}

export function UserProfileHeader({ user, isOwnProfile = false }: UserProfileHeaderProps) {
  const [showMessageDialog, setShowMessageDialog] = useState(false);

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
      {/* Enhanced Banner with animated gradient */}
      <div className="relative h-36 overflow-hidden rounded-t-lg">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/20 to-accent/30" />
        {/* Animated overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Decorative corner flourishes */}
        <div className="absolute top-3 right-3">
          <Sparkles className="h-5 w-5 text-white/30" />
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className="relative -mt-16 mb-4">
          <Avatar className="h-32 w-32 border-4 border-background shadow-elevated ring-4 ring-primary/20">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? user.username ?? 'User'} />
            <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-accent text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Online indicator or badge could go here */}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Name and Bio */}
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{user.name ?? user.username}</h1>
              {user.username && user.name && (
                <p className="text-muted-foreground">@{user.username}</p>
              )}
            </div>

            {user.bio && (
              <p className="text-sm text-foreground/80 max-w-xl leading-relaxed">{user.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                Joined {formatDate(user.createdAt)}
              </span>
              {/* Could add more metadata here like location, website, etc. */}
            </div>
          </div>

          {/* Social Actions */}
          {!isOwnProfile && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMessageDialog(true)}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                Message
              </Button>
              <FollowButton userId={user.id} />
            </div>
          )}

          {isOwnProfile && (
            <Badge variant="muted-primary" size="lg">
              Your Profile
            </Badge>
          )}
        </div>

        {/* Message Dialog */}
        {!isOwnProfile && (
          <NewMessageDialog
            recipientId={user.id}
            recipientName={user.name ?? user.username ?? undefined}
            open={showMessageDialog}
            onOpenChange={setShowMessageDialog}
          />
        )}

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
      {/* Banner skeleton */}
      <div className="h-36 bg-gradient-to-br from-muted to-muted/50 rounded-t-lg animate-pulse" />

      <div className="px-6 pb-6">
        {/* Avatar skeleton */}
        <div className="relative -mt-16 mb-4">
          <Skeleton className="h-32 w-32 rounded-full border-4 border-background" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-full max-w-xl" />

          {/* Stats skeleton */}
          <div className="flex gap-6 mt-6">
            <Skeleton className="h-12 w-24 rounded-lg" />
            <Skeleton className="h-12 w-24 rounded-lg" />
            <Skeleton className="h-12 w-24 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
