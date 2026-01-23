'use client';

import { use } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeft } from 'lucide-react';
import { useFollowers, useUserProfile } from '@/hooks';
import { Container } from '@/components/layout/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserList } from '@/components/profile';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default function FollowersPage({ params }: PageProps) {
  const { userId } = use(params);
  const { data: user, isLoading: userLoading } = useUserProfile(userId);
  const { data, isLoading: followersLoading } = useFollowers(userId);

  const followers = data?.users ?? [];
  const isLoading = userLoading || followersLoading;

  return (
    <div className="py-8">
      <Container className="max-w-2xl">
        <div className="mb-6">
          <Link
            href={`/users/${userId}` as Route}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {userLoading ? (
                <Skeleton className="h-6 w-40" />
              ) : (
                `${user?.name ?? user?.username ?? 'User'}'s Followers`
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UserList users={followers} isLoading={isLoading} emptyMessage="No followers yet" />
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
