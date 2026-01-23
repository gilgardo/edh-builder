'use client';

import { use } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import { ArrowLeft } from 'lucide-react';
import { useUserProfile } from '@/hooks';
import { Container } from '@/components/layout/container';
import { DeckGallery } from '@/components/decks/deck-gallery';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{ userId: string }>;
}

export default function UserDecksPage({ params }: PageProps) {
  const { userId } = use(params);
  const { data: user, isLoading } = useUserProfile(userId);

  return (
    <div className="py-8">
      <Container>
        <div className="mb-6">
          <Link
            href={`/users/${userId}` as Route}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Profile
          </Link>
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">
            {isLoading ? (
              <Skeleton className="h-8 w-48" />
            ) : (
              `${user?.name ?? user?.username ?? 'User'}'s Decks`
            )}
          </h1>
          <DeckGallery userId={userId} showFilters={true} />
        </div>
      </Container>
    </div>
  );
}
