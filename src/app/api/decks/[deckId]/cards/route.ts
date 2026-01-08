import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AddCardToDeckSchema } from '@/schemas/deck.schema';

interface RouteParams {
  params: Promise<{ deckId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { deckId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { userId: true, colorIdentity: true },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    if (deck.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = AddCardToDeckSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid card data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if card exists in database
    const card = await prisma.card.findUnique({
      where: { id: data.cardId },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Upsert the deck card relationship
    const deckCard = await prisma.deckCard.upsert({
      where: {
        deckId_cardId: {
          deckId,
          cardId: data.cardId,
        },
      },
      update: {
        quantity: data.quantity,
        category: data.category,
      },
      create: {
        deckId,
        cardId: data.cardId,
        quantity: data.quantity,
        category: data.category,
      },
      include: {
        card: true,
      },
    });

    // Update deck's color identity based on cards
    const allDeckCards = await prisma.deckCard.findMany({
      where: { deckId },
      include: { card: true },
    });

    const colorIdentity = new Set<string>();
    allDeckCards.forEach((dc) => {
      // colorIdentity is stored as comma-separated string in Card
      if (dc.card.colorIdentity) {
        dc.card.colorIdentity.split(',').forEach((c: string) => colorIdentity.add(c.trim()));
      }
    });

    await prisma.deck.update({
      where: { id: deckId },
      data: { colorIdentity: Array.from(colorIdentity) },
    });

    return NextResponse.json({ deckCard }, { status: 201 });
  } catch (error) {
    console.error('Add card error:', error);
    return NextResponse.json({ error: 'Failed to add card' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { deckId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { userId: true },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    if (deck.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { cardId } = await request.json();

    if (!cardId) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    await prisma.deckCard.delete({
      where: {
        deckId_cardId: {
          deckId,
          cardId,
        },
      },
    });

    // Update deck's color identity
    const allDeckCards = await prisma.deckCard.findMany({
      where: { deckId },
      include: { card: true },
    });

    const colorIdentity = new Set<string>();
    allDeckCards.forEach((dc) => {
      // colorIdentity is stored as comma-separated string in Card
      if (dc.card.colorIdentity) {
        dc.card.colorIdentity.split(',').forEach((c: string) => colorIdentity.add(c.trim()));
      }
    });

    await prisma.deck.update({
      where: { id: deckId },
      data: { colorIdentity: Array.from(colorIdentity) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove card error:', error);
    return NextResponse.json({ error: 'Failed to remove card' }, { status: 500 });
  }
}
