'use client';

import { use } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Settings } from 'lucide-react';

import { useUserProfile } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Container } from '@/components/layout/container';
import { UserProfileHeader, UserProfileHeaderSkeleton } from '@/components/profile';
import { DeckGallery } from '@/components/decks/deck-gallery';

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default function UserProfilePage({ params }: PageProps) {
  const { userId } = use(params);
  const { data: session } = useSession();
  const { data: user, isLoading, error } = useUserProfile(userId);

  const isOwnProfile = session?.user?.id === userId;

  if (isLoading) {
    return (
      <div className="py-8">
        <Container>
          <div className="mb-6">
            <Link
              href="/decks"
              className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Decks
            </Link>
          </div>
          <Card className="overflow-hidden">
            <UserProfileHeaderSkeleton />
          </Card>
        </Container>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="py-8">
        <Container className="max-w-4xl">
          <div className="py-12 text-center">
            <h1 className="text-2xl font-bold">User not found</h1>
            <p className="text-muted-foreground mt-2">
              This user may have been deleted or does not exist.
            </p>
            <Link href="/decks">
              <Button className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Decks
              </Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8">
      <Container>
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/decks"
            className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Decks
          </Link>
          {isOwnProfile && (
            <Link href={'/settings/profile' as Route}>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          )}
        </div>

        {/* Profile Card */}
        <Card className="mb-8 overflow-hidden">
          <UserProfileHeader user={user} isOwnProfile={isOwnProfile} />
        </Card>

        {/* User's Decks */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            {isOwnProfile ? 'Your Decks' : `${user.name ?? user.username ?? 'User'}'s Decks`}
          </h2>
          <DeckGallery userId={userId} showFilters={true} />
        </div>
      </Container>
    </div>
  );
}
