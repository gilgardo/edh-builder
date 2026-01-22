'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { Container } from '@/components/layout/container';
import { NotificationList } from '@/components/notifications';

export default function NotificationsPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="py-8">
        <Container className="max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="py-8">
        <Container className="max-w-3xl">
          <div className="py-12 text-center">
            <h1 className="text-2xl font-bold">Sign in required</h1>
            <p className="text-muted-foreground mt-2">
              You need to be signed in to view notifications.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Sign in
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-8">
      <Container className="max-w-3xl">
        <div className="mb-6">
          <Link
            href="/decks"
            className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Decks
          </Link>
        </div>

        <NotificationList />
      </Container>
    </div>
  );
}
