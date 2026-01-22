import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UpdateCollaboratorSchema } from '@/schemas/social.schema';
import { notifyCollaborationAccepted } from '@/services/notification.service';

interface RouteParams {
  params: Promise<{ deckId: string; collaboratorId: string }>;
}

// PUT - Update collaborator (role or status)
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { deckId, collaboratorId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the collaborator record
    const existingCollab = await prisma.deckCollaborator.findUnique({
      where: { id: collaboratorId },
      include: {
        deck: {
          select: { id: true, name: true, userId: true },
        },
      },
    });

    if (!existingCollab || existingCollab.deckId !== deckId) {
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = UpdateCollaboratorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { role, status } = parsed.data;

    const isOwner = session.user.id === existingCollab.deck.userId;
    const isInvitee = session.user.id === existingCollab.userId;

    // Only the invitee can accept/decline
    if (status && !isInvitee) {
      return NextResponse.json({ error: 'Only the invited user can accept or decline' }, { status: 403 });
    }

    // Only owner or admin can change role
    if (role) {
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
    }

    // Build update data
    const updateData: { role?: 'VIEWER' | 'EDITOR' | 'ADMIN'; status?: 'ACCEPTED' | 'DECLINED'; joinedAt?: Date } = {};

    if (role) {
      updateData.role = role;
    }

    if (status) {
      updateData.status = status;
      if (status === 'ACCEPTED') {
        updateData.joinedAt = new Date();
      }
    }

    const collaborator = await prisma.deckCollaborator.update({
      where: { id: collaboratorId },
      data: updateData,
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

    // Notify the deck owner if invite was accepted
    if (status === 'ACCEPTED') {
      await notifyCollaborationAccepted({
        inviterId: existingCollab.deck.userId,
        deckId,
        deckName: existingCollab.deck.name,
        accepterId: session.user.id,
        accepterName: session.user.name ?? 'Someone',
      });
    }

    return NextResponse.json(collaborator);
  } catch (error) {
    console.error('Update collaborator error:', error);
    return NextResponse.json({ error: 'Failed to update collaborator' }, { status: 500 });
  }
}

// DELETE - Remove collaborator
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { deckId, collaboratorId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the collaborator record
    const existingCollab = await prisma.deckCollaborator.findUnique({
      where: { id: collaboratorId },
      include: {
        deck: {
          select: { id: true, userId: true },
        },
      },
    });

    if (!existingCollab || existingCollab.deckId !== deckId) {
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 });
    }

    const isOwner = session.user.id === existingCollab.deck.userId;
    const isSelf = session.user.id === existingCollab.userId;

    // Owner can remove anyone, collaborators can only remove themselves
    if (!isOwner && !isSelf) {
      // Check if current user is admin
      const userCollab = await prisma.deckCollaborator.findUnique({
        where: {
          deckId_userId: {
            deckId,
            userId: session.user.id,
          },
        },
      });
      const isAdmin = !!userCollab && userCollab.role === 'ADMIN' && userCollab.status === 'ACCEPTED';

      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    await prisma.deckCollaborator.delete({
      where: { id: collaboratorId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: 500 });
  }
}
