import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { SendMessageToConversationSchema } from '@/schemas/social.schema';
import { notifyNewMessage } from '@/services/notification.service';
import type { MessageWithSender } from '@/types/social.types';

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

// GET - Get messages in a conversation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { conversationId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '30', 10)));
    const skip = (page - 1) * limit;

    // Verify conversation exists and user is a participant
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        participant1: true,
        participant2: true,
        user1: {
          select: { id: true, name: true, username: true, image: true },
        },
        user2: {
          select: { id: true, name: true, username: true, image: true },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user is a participant
    if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where: { conversationId } }),
    ]);

    // Reverse to get chronological order for display
    const messagesInOrder = messages.reverse();

    return NextResponse.json({
      messages: messagesInOrder as MessageWithSender[],
      total,
      hasMore: skip + limit < total,
      conversation: {
        id: conversation.id,
        user1: conversation.user1,
        user2: conversation.user2,
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: 'Failed to get messages' }, { status: 500 });
  }
}

// POST - Send a message to an existing conversation
export async function POST(request: NextRequest, { params }: RouteParams) {
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
        user1: { select: { id: true, name: true } },
        user2: { select: { id: true, name: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user is a participant
    if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = SendMessageToConversationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid message data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content } = parsed.data;

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId,
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
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    // Determine recipient
    const recipientId =
      conversation.participant1 === userId ? conversation.participant2 : conversation.participant1;

    // Notify recipient
    await notifyNewMessage({
      recipientId,
      conversationId,
      senderId: userId,
      senderName: session.user.name ?? 'Someone',
      messageContent: content,
    });

    return NextResponse.json(message as MessageWithSender, { status: 201 });
  } catch (error) {
    console.error('Send message to conversation error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
