import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UpdateReviewSchema } from '@/schemas/social.schema';

interface RouteParams {
  params: Promise<{ deckId: string; reviewId: string }>;
}

// PUT - Update a review
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { deckId, reviewId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the review and verify ownership
    const existingReview = await prisma.deckReview.findUnique({
      where: { id: reviewId },
      select: { id: true, deckId: true, userId: true },
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (existingReview.deckId !== deckId) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (existingReview.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = UpdateReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid review data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const review = await prisma.deckReview.update({
      where: { id: reviewId },
      data: {
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Update review error:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

// DELETE - Delete a review
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { deckId, reviewId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the review
    const existingReview = await prisma.deckReview.findUnique({
      where: { id: reviewId },
      select: { id: true, deckId: true, userId: true },
    });

    if (!existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (existingReview.deckId !== deckId) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Users can delete their own reviews, deck owners can delete any review
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { userId: true },
    });

    const isReviewOwner = existingReview.userId === session.user.id;
    const isDeckOwner = deck?.userId === session.user.id;

    if (!isReviewOwner && !isDeckOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.deckReview.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
