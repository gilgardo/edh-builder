import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deleteNotification } from '@/services/notification.service';

interface RouteParams {
  params: Promise<{ notificationId: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { notificationId } = await params;
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deleted = await deleteNotification({
      userId: session.user.id,
      notificationId,
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
