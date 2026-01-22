import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getNotifications } from '@/services/notification.service';
import type { NotificationType } from '@prisma/client';

const VALID_TYPES: NotificationType[] = [
  'DECK_LIKE',
  'DECK_REVIEW',
  'COLLABORATION_INVITE',
  'COLLABORATION_ACCEPTED',
  'NEW_FOLLOWER',
  'NEW_MESSAGE',
];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const typeParam = searchParams.get('type');
    const type = typeParam && VALID_TYPES.includes(typeParam as NotificationType)
      ? (typeParam as NotificationType)
      : undefined;

    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

    const result = await getNotifications({
      userId: session.user.id,
      type,
      unreadOnly,
      page,
      limit,
    });

    return NextResponse.json({
      notifications: result.notifications,
      total: result.total,
      unreadCount: result.unreadCount,
      page,
      limit,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json({ error: 'Failed to get notifications' }, { status: 500 });
  }
}
