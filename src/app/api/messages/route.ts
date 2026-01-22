import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SendMessageSchema } from '@/schemas/social.schema';
import { notifyNewMessage } from '@/services/notification.service';
import type { ConversationPreview, MessageWithSender } from '@/types/social.types';

// GET - List conversations for the authenticated user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all conversations where user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ participant1: userId }, { participant2: userId }],
      },
      include: {
        user1: {
          select: { id: true, name: true, username: true, image: true },
        },
        user2: {
          select: { id: true, name: true, username: true, image: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    // Transform to ConversationPreview format with unread counts
    const conversationsWithUnread: ConversationPreview[] = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            readAt: null,
          },
        });

        return {
          ...conv,
          lastMessage: conv.messages[0] ?? undefined,
          unreadCount,
        };
      })
    );

    return NextResponse.json({
      conversations: conversationsWithUnread,
      total: conversations.length,
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json({ error: 'Failed to get conversations' }, { status: 500 });
  }
}

// POST - Send a new message (creates conversation if needed)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const parsed = SendMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid message data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { recipientId, content } = parsed.data;

    // Can't message yourself
    if (recipientId === userId) {
      return NextResponse.json({ error: 'Cannot send message to yourself' }, { status: 400 });
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true, name: true },
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Find or create conversation (ensuring consistent participant order)
    const sorted = [userId, recipientId].sort();
    const p1 = sorted[0] as string;
    const p2 = sorted[1] as string;

    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1: userId, participant2: recipientId },
          { participant1: recipientId, participant2: userId },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participant1: p1,
          participant2: p2,
        },
      });
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        content,
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    // Update conversation's lastMessageAt
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    // Notify recipient
    await notifyNewMessage({
      recipientId,
      conversationId: conversation.id,
      senderId: userId,
      senderName: session.user.name ?? 'Someone',
      messageContent: content,
    });

    return NextResponse.json(message as MessageWithSender, { status: 201 });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
