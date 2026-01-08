import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UpdateDeckSchema } from '@/schemas/deck.schema';

interface RouteParams {
  params: Promise<{ deckId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { deckId } = await params;
    const session = await auth();

    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        commander: true,
        partner: true,
        cards: {
          include: {
            card: true,
          },
          orderBy: [{ category: 'asc' }, { card: { name: 'asc' } }],
        },
        tags: {
          include: { tag: true },
        },
        favorites: {
          select: { id: true },
        },
      },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Check if user can view this deck
    if (!deck.isPublic && deck.userId !== session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if current user has liked this deck
    let isLiked = false;
    if (session?.user?.id) {
      const like = await prisma.favoriteDeck.findUnique({
        where: {
          userId_deckId: {
            userId: session.user.id,
            deckId: deck.id,
          },
        },
      });
      isLiked = !!like;
    }

    return NextResponse.json({ deck, isLiked });
  } catch (error) {
    console.error('Get deck error:', error);
    return NextResponse.json({ error: 'Failed to get deck' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { deckId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const existingDeck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { userId: true },
    });

    if (!existingDeck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    if (existingDeck.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = UpdateDeckSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid deck data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const deck = await prisma.deck.update({
      where: { id: deckId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.format !== undefined && { format: data.format }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        ...(data.commanderId !== undefined && { commanderId: data.commanderId }),
        ...(data.partnerId !== undefined && { partnerId: data.partnerId }),
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        commander: true,
        partner: true,
      },
    });

    return NextResponse.json({ deck });
  } catch (error) {
    console.error('Update deck error:', error);
    return NextResponse.json({ error: 'Failed to update deck' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { deckId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const existingDeck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { userId: true },
    });

    if (!existingDeck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    if (existingDeck.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.deck.delete({
      where: { id: deckId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete deck error:', error);
    return NextResponse.json({ error: 'Failed to delete deck' }, { status: 500 });
  }
}
