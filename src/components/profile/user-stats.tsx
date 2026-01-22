'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { cn } from '@/lib/utils';

interface UserStatsProps {
  userId: string;
  followerCount: number;
  followingCount: number;
  deckCount: number;
  className?: string;
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function UserStats({
  userId,
  followerCount,
  followingCount,
  deckCount,
  className,
}: UserStatsProps) {
  return (
    <div className={cn('flex gap-6', className)}>
      <Link
        href={`/users/${userId}/followers` as Route}
        className="group text-center hover:bg-muted rounded-lg px-3 py-2 -mx-3 -my-2 transition-colors"
      >
        <p className="text-xl font-bold group-hover:text-primary transition-colors">
          {formatCount(followerCount)}
        </p>
        <p className="text-sm text-muted-foreground">
          Follower{followerCount !== 1 ? 's' : ''}
        </p>
      </Link>

      <Link
        href={`/users/${userId}/following` as Route}
        className="group text-center hover:bg-muted rounded-lg px-3 py-2 -mx-3 -my-2 transition-colors"
      >
        <p className="text-xl font-bold group-hover:text-primary transition-colors">
          {formatCount(followingCount)}
        </p>
        <p className="text-sm text-muted-foreground">Following</p>
      </Link>

      <Link
        href={`/users/${userId}/decks` as Route}
        className="group text-center hover:bg-muted rounded-lg px-3 py-2 -mx-3 -my-2 transition-colors"
      >
        <p className="text-xl font-bold group-hover:text-primary transition-colors">
          {formatCount(deckCount)}
        </p>
        <p className="text-sm text-muted-foreground">
          Deck{deckCount !== 1 ? 's' : ''}
        </p>
      </Link>
    </div>
  );
}
