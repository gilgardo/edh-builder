import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { CreateDeckSchema, DeckFiltersSchema } from '@/schemas/deck.schema';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    // Parse filters
    const parsed = DeckFiltersSchema.safeParse({
      ...params,
      colorIdentity: params.colorIdentity?.split(',').filter(Boolean),
      page: params.page ? parseInt(params.page, 10) : 1,
      limit: params.limit ? parseInt(params.limit, 10) : 20,
      isPublic: params.isPublic === 'true' ? true : params.isPublic === 'false' ? false : undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid filter parameters', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const filters = parsed.data;
    const skip = (filters.page - 1) * filters.limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }

    if (filters.colorIdentity && filters.colorIdentity.length > 0) {
      where.colorIdentity = { hasEvery: filters.colorIdentity };
    }

    if (filters.format) {
      where.format = filters.format;
    }

    if (filters.userId) {
      where.userId = filters.userId;
      // If viewing own decks, show all (public + private)
      // If viewing someone else's decks, only show public
      if (filters.userId !== session?.user?.id) {
        where.isPublic = true;
      }
      // Otherwise show all decks for the owner (no isPublic filter)
    } else {
      // No user filter = browse public decks only
      where.isPublic = true;
    }

    const [decks, total] = await Promise.all([
      prisma.deck.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
          commander: {
            select: { id: true, name: true, scryfallId: true, imageUris: true },
          },
          _count: {
            select: { cards: true },
          },
          favorites: {
            select: { id: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: filters.limit,
      }),
      prisma.deck.count({ where }),
    ]);

    return NextResponse.json({
      decks,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    });
  } catch (error) {
    console.error('List decks error:', error);
    return NextResponse.json({ error: 'Failed to list decks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = CreateDeckSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid deck data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Ensure user exists in database (handles edge case where session exists but user doesn't)
    await prisma.user.upsert({
      where: { id: session.user.id },
      update: {},
      create: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      },
    });

    const deck = await prisma.deck.create({
      data: {
        name: data.name,
        description: data.description,
        format: data.format,
        isPublic: data.isPublic,
        colorIdentity: [],
        userId: session.user.id,
        commanderId: data.commanderId,
        partnerId: data.partnerId,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        commander: true,
        partner: true,
      },
    });

    return NextResponse.json({ deck }, { status: 201 });
  } catch (error) {
    console.error('Create deck error:', error);
    return NextResponse.json({ error: 'Failed to create deck' }, { status: 500 });
  }
}
