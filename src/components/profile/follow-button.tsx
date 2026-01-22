'use client';

import { useState } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsFollowing, useFollowUser, useUnfollowUser } from '@/hooks';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  userId: string;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
}

export function FollowButton({ userId, className, size = 'default' }: FollowButtonProps) {
  const [isHovering, setIsHovering] = useState(false);
  const { data, isLoading } = useIsFollowing(userId);
  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const isFollowing = data?.isFollowing ?? false;
  const isPending = followUser.isPending || unfollowUser.isPending;

  const handleClick = () => {
    if (isFollowing) {
      unfollowUser.mutate(userId);
    } else {
      followUser.mutate(userId);
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (isFollowing) {
    return (
      <Button
        variant={isHovering ? 'destructive' : 'outline'}
        size={size}
        onClick={handleClick}
        disabled={isPending}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={cn('min-w-[100px]', className)}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isHovering ? (
          <>
            <UserMinus className="h-4 w-4 mr-1" />
            Unfollow
          </>
        ) : (
          'Following'
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size={size}
      onClick={handleClick}
      disabled={isPending}
      className={cn('min-w-[100px]', className)}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-1" />
          Follow
        </>
      )}
    </Button>
  );
}
