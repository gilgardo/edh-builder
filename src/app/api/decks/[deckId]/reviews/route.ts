import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateReviewSchema } from '@/schemas/social.schema';
import { notifyDeckReview } from '@/services/notification.service';

interface RouteParams {
  params: Promise<{ deckId: string }>;
}

// GET - List reviews for a deck
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { deckId } = await params;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10', 10)));
    const skip = (page - 1) * limit;

    // Check if deck exists and is accessible
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { id: true, isPublic: true, userId: true },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    const session = await auth();

    // Private decks can only be reviewed by owner
    if (!deck.isPublic && deck.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    const [reviews, total, avgResult] = await Promise.all([
      prisma.deckReview.findMany({
        where: { deckId },
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.deckReview.count({ where: { deckId } }),
      prisma.deckReview.aggregate({
        where: { deckId },
        _avg: { rating: true },
      }),
    ]);

    return NextResponse.json({
      reviews,
      total,
      page,
      limit,
      averageRating: avgResult._avg.rating,
    });
  } catch (error) {
    console.error('Get deck reviews error:', error);
    return NextResponse.json({ error: 'Failed to get reviews' }, { status: 500 });
  }
}

// POST - Create a review
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { deckId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if deck exists and is accessible
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { id: true, name: true, isPublic: true, userId: true },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Can't review private decks (unless you're the owner, but that's weird)
    if (!deck.isPublic && deck.userId !== session.user.id) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Check if user already reviewed this deck
    const existingReview = await prisma.deckReview.findUnique({
      where: {
        deckId_userId: {
          deckId,
          userId: session.user.id,
        },
      },
    });

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this deck' }, { status: 409 });
    }

    const body = await request.json();
    const parsed = CreateReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid review data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const review = await prisma.deckReview.create({
      data: {
        deckId,
        userId: session.user.id,
        rating: data.rating,
        title: data.title,
        content: data.content,
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

    // Notify deck owner (if different from reviewer)
    if (deck.userId !== session.user.id) {
      await notifyDeckReview({
        deckOwnerId: deck.userId,
        deckId,
        deckName: deck.name,
        reviewerId: session.user.id,
        reviewerName: session.user.name ?? 'Someone',
        rating: data.rating,
      });
    }

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
