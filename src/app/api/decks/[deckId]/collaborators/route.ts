import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { InviteCollaboratorSchema } from '@/schemas/social.schema';
import { notifyCollaborationInvite } from '@/services/notification.service';

interface RouteParams {
  params: Promise<{ deckId: string }>;
}

// GET - List collaborators for a deck
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { deckId } = await params;
    const session = await auth();

    // Check if deck exists
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { id: true, userId: true, isPublic: true },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Only deck owner and collaborators can see the collaborator list
    const isOwner = session?.user?.id === deck.userId;
    let isCollaborator = false;

    if (session?.user?.id && !isOwner) {
      const collab = await prisma.deckCollaborator.findUnique({
        where: {
          deckId_userId: {
            deckId,
            userId: session.user.id,
          },
        },
      });
      isCollaborator = !!collab && collab.status === 'ACCEPTED';
    }

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const collaborators = await prisma.deckCollaborator.findMany({
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
      orderBy: { invitedAt: 'desc' },
    });

    return NextResponse.json({
      collaborators,
      total: collaborators.length,
    });
  } catch (error) {
    console.error('Get collaborators error:', error);
    return NextResponse.json({ error: 'Failed to get collaborators' }, { status: 500 });
  }
}

// POST - Invite a collaborator
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { deckId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if deck exists and user is owner or admin
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: { id: true, name: true, userId: true },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    const isOwner = session.user.id === deck.userId;

    // Check if current user is an admin collaborator
    let isAdmin = false;
    if (!isOwner) {
      const userCollab = await prisma.deckCollaborator.findUnique({
        where: {
          deckId_userId: {
            deckId,
            userId: session.user.id,
          },
        },
      });
      isAdmin = !!userCollab && userCollab.role === 'ADMIN' && userCollab.status === 'ACCEPTED';
    }

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = InviteCollaboratorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { userId, role } = parsed.data;

    // Can't invite yourself
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
    }

    // Can't invite the deck owner
    if (userId === deck.userId) {
      return NextResponse.json({ error: 'Cannot invite the deck owner' }, { status: 400 });
    }

    // Check if user exists
    const inviteeExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!inviteeExists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already invited
    const existingInvite = await prisma.deckCollaborator.findUnique({
      where: {
        deckId_userId: {
          deckId,
          userId,
        },
      },
    });

    if (existingInvite) {
      return NextResponse.json({ error: 'User is already a collaborator or has a pending invite' }, { status: 409 });
    }

    // Create the collaboration invite
    const collaborator = await prisma.deckCollaborator.create({
      data: {
        deckId,
        userId,
        role,
        status: 'PENDING',
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

    // Notify the invitee
    await notifyCollaborationInvite({
      inviteeId: userId,
      deckId,
      deckName: deck.name,
      inviterId: session.user.id,
      inviterName: session.user.name ?? 'Someone',
      role,
    });

    return NextResponse.json(collaborator, { status: 201 });
  } catch (error) {
    console.error('Invite collaborator error:', error);
    return NextResponse.json({ error: 'Failed to invite collaborator' }, { status: 500 });
  }
}
