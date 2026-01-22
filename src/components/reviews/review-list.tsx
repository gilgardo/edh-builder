'use client';

import { useState } from 'react';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDeckReviews } from '@/hooks';
import { ReviewCard } from './review-card';
import { ReviewForm } from './review-form';
import { RatingDisplay } from './rating-stars';

interface ReviewListProps {
  deckId: string;
  deckOwnerId: string;
}

export function ReviewList({ deckId, deckOwnerId }: ReviewListProps) {
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useDeckReviews(deckId, page);

  const reviews = data?.reviews ?? [];
  const total = data?.total ?? 0;
  const averageRating = data?.averageRating ?? null;
  const hasMore = reviews.length < total;

  const currentUserId = session?.user?.id;
  const isOwnDeck = currentUserId === deckOwnerId;
  const hasReviewed = reviews.some((r) => r.userId === currentUserId);
  const canReview = currentUserId && !isOwnDeck && !hasReviewed;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Reviews</CardTitle>
          <div className="mt-2">
            <RatingDisplay rating={averageRating} reviewCount={total} />
          </div>
        </div>
        {canReview && !showForm && (
          <Button onClick={() => setShowForm(true)} size="sm">
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Write Review
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Review Form */}
        {showForm && (
          <div className="pb-4 border-b border-border">
            <ReviewForm
              deckId={deckId}
              onSuccess={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {/* Reviews List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">No reviews yet</p>
            {canReview && (
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to review this deck!
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                deckId={deckId}
                isOwnReview={review.userId === currentUserId}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={isFetching}
            >
              {isFetching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Load more reviews'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
