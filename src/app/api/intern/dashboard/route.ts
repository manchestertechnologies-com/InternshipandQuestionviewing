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
      include: {
        mentor: true,
      },
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

    // Load upcoming targeted meetings
    const todayStr = new Date().toISOString().split('T')[0];
    const meetingTargets = await prisma.meetingTarget.findMany({
      where: {
        internId: intern.id,
        meeting: {
          date: { gte: todayStr },
        },
      },
      include: {
        meeting: {
          include: {
            mentor: true,
          },
        },
      },
      orderBy: {
        meeting: {
          date: 'asc',
        },
      },
      take: 2,
    });

    const meetings = meetingTargets.map((mt) => ({
      id: mt.meeting.id,
      title: mt.meeting.title,
      meetLink: mt.meeting.meetLink,
      date: mt.meeting.date,
      time: mt.meeting.time,
      meetingType: mt.meeting.meetingType,
      mentorName: mt.meeting.mentor.name,
    }));

    return NextResponse.json({
      notifications,
      announcements,
      profile: intern,
      meetings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
