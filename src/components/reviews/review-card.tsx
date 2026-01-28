'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreVertical, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { Route } from 'next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RatingStars } from './rating-stars';
import { ReviewForm } from './review-form';
import { useDeleteReview } from '@/hooks';
import { useToast } from '@/components/ui/toast';
import type { DeckReviewWithUser } from '@/types/social.types';

interface ReviewCardProps {
  review: DeckReviewWithUser;
  deckId: string;
  isOwnReview?: boolean;
}

export function ReviewCard({ review, deckId, isOwnReview = false }: ReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deleteReview = useDeleteReview();
  const { toast } = useToast();

  const initials = review.user.name
    ? review.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : review.user.username?.slice(0, 2).toUpperCase() ?? '?';

  const handleDelete = () => {
    deleteReview.mutate(
      { deckId, reviewId: review.id },
      {
        onSuccess: () => setShowDeleteDialog(false),
        onError: () => toast('Failed to delete review', 'error'),
      }
    );
  };

  if (isEditing) {
    return (
      <Card>
        <CardContent className="p-4">
          <ReviewForm
            deckId={deckId}
            existingReview={review}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Author Info */}
            <div className="flex items-start gap-3">
              <Link href={`/users/${review.userId}` as Route}>
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={review.user.image ?? undefined}
                    alt={review.user.name ?? review.user.username ?? 'User'}
                  />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <Link
                  href={`/users/${review.userId}` as Route}
                  className="font-medium hover:underline"
                >
                  {review.user.name ?? review.user.username}
                </Link>
                <div className="flex items-center gap-2 mt-0.5">
                  <RatingStars rating={review.rating} size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {isOwnReview && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Review Content */}
          {review.title && (
            <h4 className="font-medium mt-3">{review.title}</h4>
          )}
          {review.content && (
            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
              {review.content}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
