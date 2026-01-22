import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

// PUT - Mark all messages in conversation as read
export async function PUT(_request: Request, { params }: RouteParams) {
  try {
    const { conversationId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Verify conversation exists and user is a participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        participant1: true,
        participant2: true,
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user is a participant
    if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Mark all unread messages from the other user as read
    const result = await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return NextResponse.json({ markedAsRead: result.count });
  } catch (error) {
    console.error('Mark conversation read error:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}
