'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, PenSquare } from 'lucide-react';
import { useSession } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { Container } from '@/components/layout/container';
import { MessageInbox, NewMessageDialog } from '@/components/messaging';

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const [newMessageOpen, setNewMessageOpen] = useState(false);

  if (status === 'loading') {
    return (
      <div className="py-8">
        <Container className="max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded" />
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
              You need to be signed in to view messages.
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
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/decks"
            className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Decks
          </Link>

          <Button size="sm" onClick={() => setNewMessageOpen(true)}>
            <PenSquare className="mr-2 h-4 w-4" />
            New Message
          </Button>
        </div>

        <MessageInbox />

        <NewMessageDialog open={newMessageOpen} onOpenChange={setNewMessageOpen} />
      </Container>
    </div>
  );
}
