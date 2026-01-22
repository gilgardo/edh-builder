'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { FollowButton } from './follow-button';
import type { UserProfile } from '@/types/social.types';
import { cn } from '@/lib/utils';

interface UserProfileCardProps {
  user: UserProfile;
  showFollowButton?: boolean;
  isOwnProfile?: boolean;
  className?: string;
}

export function UserProfileCard({
  user,
  showFollowButton = true,
  isOwnProfile = false,
  className,
}: UserProfileCardProps) {
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.username?.slice(0, 2).toUpperCase() ?? '?';

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Link href={`/users/${user.id}` as Route}>
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={user.image ?? undefined}
                alt={user.name ?? user.username ?? 'User'}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex-1 min-w-0">
            <Link href={`/users/${user.id}` as Route} className="hover:underline">
              <p className="font-medium truncate">{user.name ?? user.username}</p>
              {user.username && user.name && (
                <p className="text-sm text-muted-foreground truncate">
                  @{user.username}
                </p>
              )}
            </Link>

            {user.bio && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {user.bio}
              </p>
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span>{user.followerCount} followers</span>
              <span>{user.deckCount} decks</span>
            </div>
          </div>

          {showFollowButton && !isOwnProfile && (
            <FollowButton userId={user.id} size="sm" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
