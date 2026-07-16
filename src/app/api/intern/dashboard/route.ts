import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'INTERN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = session.user.id;

    // Get InternProfile
    const intern = await prisma.internProfile.findUnique({
      where: { userId },
    });

    if (!intern) {
      return NextResponse.json({ error: 'Intern profile not found' }, { status: 404 });
    }

    // Load unread notifications
    const notifications = await prisma.notification.findMany({
      where: { userId, readStatus: false },
      orderBy: { createdAt: 'desc' },
    });

    // Load announcements for this intern's group AND (domain matches or domain is null)
    const announcements = await prisma.announcement.findMany({
      where: {
        group: intern.group,
        OR: [
          { domain: null },
          { domain: intern.domain },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      notifications,
      announcements,
      profile: intern,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
