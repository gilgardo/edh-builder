'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RatingStars } from './rating-stars';
import { useCreateReview, useUpdateReview } from '@/hooks';
import { CreateReviewSchema, type CreateReviewInput } from '@/schemas/social.schema';
import type { DeckReviewWithUser } from '@/types/social.types';

interface ReviewFormProps {
  deckId: string;
  existingReview?: DeckReviewWithUser;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ deckId, existingReview, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0);

  const createReview = useCreateReview();
  const updateReview = useUpdateReview();

  const isEditing = !!existingReview;
  const isPending = createReview.isPending || updateReview.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateReviewInput>({
    resolver: zodResolver(CreateReviewSchema),
    defaultValues: {
      rating: existingReview?.rating ?? 0,
      title: existingReview?.title ?? '',
      content: existingReview?.content ?? '',
    },
  });

  const onSubmit = async (data: CreateReviewInput) => {
    const reviewData = { ...data, rating };

    try {
      if (isEditing && existingReview) {
        await updateReview.mutateAsync({
          deckId,
          reviewId: existingReview.id,
          data: reviewData,
        });
      } else {
        await createReview.mutateAsync({ deckId, data: reviewData });
      }
      reset();
      setRating(0);
      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Rating */}
      <div className="space-y-2">
        <Label>Rating</Label>
        <RatingStars
          rating={rating}
          interactive
          onChange={setRating}
          size="lg"
        />
        {rating === 0 && (
          <p className="text-sm text-destructive">Please select a rating</p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title (optional)</Label>
        <Input
          id="title"
          placeholder="Sum up your review..."
          {...register('title')}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content">Review (optional)</Label>
        <Textarea
          id="content"
          placeholder="Share your thoughts about this deck..."
          rows={4}
          {...register('content')}
        />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending || rating === 0}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Update Review' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
}
