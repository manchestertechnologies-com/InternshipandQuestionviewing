import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/notifications — fetch recent unread notifications for the current user
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Fetch unread notifications, most recent first, limited to 20
    const notifications = await prisma.notification.findMany({
      where: { userId, readStatus: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json(notifications);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/notifications — mark notifications as read
// Body: { ids: string[] } or { all: true }
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;
    const body = await request.json();

    if (body.all) {
      await prisma.notification.updateMany({
        where: { userId, readStatus: false },
        data: { readStatus: true },
      });
    } else if (Array.isArray(body.ids) && body.ids.length > 0) {
      await prisma.notification.updateMany({
        where: { userId, id: { in: body.ids } },
        data: { readStatus: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
