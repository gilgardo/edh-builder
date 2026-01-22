import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyDeckLike } from '@/services/notification.service';

interface RouteParams {
  params: Promise<{ deckId: string }>;
}

// POST - Like a deck
export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { deckId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if deck exists and is accessible
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { id: true, name: true, isPublic: true, userId: true },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Can only like public decks (or your own)
    if (!deck.isPublic && deck.userId !== userId) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Check if already liked
    const existing = await prisma.favoriteDeck.findUnique({
      where: {
        userId_deckId: { userId, deckId },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already liked' }, { status: 409 });
    }

    // Create the like
    await prisma.favoriteDeck.create({
      data: { userId, deckId },
    });

    // Get updated like count
    const likeCount = await prisma.favoriteDeck.count({
      where: { deckId },
    });

    // Notify deck owner (if different from liker)
    if (deck.userId !== userId) {
      await notifyDeckLike({
        deckOwnerId: deck.userId,
        deckId,
        deckName: deck.name,
        likerId: userId,
        likerName: session.user.name ?? 'Someone',
      });
    }

    return NextResponse.json({ liked: true, likeCount }, { status: 201 });
  } catch (error) {
    console.error('Like deck error:', error);
    return NextResponse.json({ error: 'Failed to like deck' }, { status: 500 });
  }
}

// DELETE - Unlike a deck
export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { deckId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete the like (if exists)
    const result = await prisma.favoriteDeck.deleteMany({
      where: { userId, deckId },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Not liked' }, { status: 404 });
    }

    // Get updated like count
    const likeCount = await prisma.favoriteDeck.count({
      where: { deckId },
    });

    return NextResponse.json({ liked: false, likeCount });
  } catch (error) {
    console.error('Unlike deck error:', error);
    return NextResponse.json({ error: 'Failed to unlike deck' }, { status: 500 });
  }
}

// GET - Check if user has liked a deck
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { deckId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ liked: false, likeCount: 0 });
    }

    const [like, likeCount] = await Promise.all([
      prisma.favoriteDeck.findUnique({
        where: {
          userId_deckId: { userId: session.user.id, deckId },
        },
      }),
      prisma.favoriteDeck.count({ where: { deckId } }),
    ]);

    return NextResponse.json({ liked: !!like, likeCount });
  } catch (error) {
    console.error('Check like status error:', error);
    return NextResponse.json({ error: 'Failed to check like status' }, { status: 500 });
  }
}
