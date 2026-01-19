import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { syncCardFromScryfall } from '@/lib/card-sync';
import { AddCardToDeckSchema } from '@/schemas/deck.schema';
import type { ScryfallCard } from '@/types/scryfall.types';

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

    // Sync the Scryfall card to our database
    // The Zod schema validates the shape, so we can safely cast to ScryfallCard
    const card = await syncCardFromScryfall(data.scryfallCard as unknown as ScryfallCard);

    // Check if card already exists in deck
    const existingDeckCard = await prisma.deckCard.findUnique({
      where: {
        deckId_cardId: {
          deckId,
          cardId: card.id,
        },
      },
    });

    // If card exists, increment quantity; otherwise create with specified quantity
    const deckCard = existingDeckCard
      ? await prisma.deckCard.update({
          where: {
            deckId_cardId: {
              deckId,
              cardId: card.id,
            },
          },
          data: {
            quantity: existingDeckCard.quantity + data.quantity,
            category: data.category,
          },
          include: {
            card: true,
          },
        })
      : await prisma.deckCard.create({
          data: {
            deckId,
            cardId: card.id,
            quantity: data.quantity,
            category: data.category,
          },
          include: {
            card: true,
          },
        });

    // If this is a commander, update the deck's commanderId
    if (data.category === 'COMMANDER') {
      await prisma.deck.update({
        where: { id: deckId },
        data: { commanderId: card.id },
      });
    }

    // Update deck's color identity based on cards
    const allDeckCards = await prisma.deckCard.findMany({
      where: { deckId },
      include: { card: true },
    });

    const colorIdentity = new Set<string>();
    allDeckCards.forEach((dc: { card: { colorIdentity: string | null } }) => {
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

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { cardId, quantity, category } = await request.json();

    if (!cardId) {
      return NextResponse.json({ error: 'Card ID is required' }, { status: 400 });
    }

    // Build update data
    type UpdateData = { quantity?: number; category?: 'MAIN' | 'COMMANDER' | 'SIDEBOARD' | 'CONSIDERING' };
    const updateData: UpdateData = {};
    if (quantity !== undefined) {
      if (quantity < 1 || quantity > 99) {
        return NextResponse.json({ error: 'Quantity must be between 1 and 99' }, { status: 400 });
      }
      updateData.quantity = quantity;
    }
    if (category !== undefined) {
      const validCategories = ['MAIN', 'COMMANDER', 'SIDEBOARD', 'CONSIDERING'] as const;
      if (!validCategories.includes(category)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
      updateData.category = category as UpdateData['category'];
    }

    const deckCard = await prisma.deckCard.update({
      where: {
        deckId_cardId: {
          deckId,
          cardId,
        },
      },
      data: updateData,
      include: {
        card: true,
      },
    });

    return NextResponse.json({ deckCard });
  } catch (error) {
    console.error('Update deck card error:', error);
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
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
    const remainingDeckCards = await prisma.deckCard.findMany({
      where: { deckId },
      include: { card: true },
    });

    const colorIdentity = new Set<string>();
    remainingDeckCards.forEach((dc: { card: { colorIdentity: string | null } }) => {
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
