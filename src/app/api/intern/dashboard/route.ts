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

    // Load all targeted meetings
    const meetingTargets = await prisma.meetingTarget.findMany({
      where: {
        internId: intern.id,
      },
      include: {
        meeting: {
          include: {
            mentor: true,
          },
        },
      },
    });

    const now = new Date();

    const parsedMeetings = meetingTargets.map((mt) => ({
      id: mt.meeting.id,
      title: mt.meeting.title,
      meetLink: mt.meeting.meetLink,
      date: mt.meeting.date,
      time: mt.meeting.time,
      meetingType: mt.meeting.meetingType,
      mentorName: mt.meeting.mentor.name,
      dateTime: new Date(`${mt.meeting.date}T${mt.meeting.time || '00:00'}:00`),
    }));

    const upcomingMeetings = parsedMeetings
      .filter((m) => m.dateTime >= now)
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
      .map(({ dateTime, ...m }) => m); // strip helper date object

    const pastMeetings = parsedMeetings
      .filter((m) => m.dateTime < now)
      .sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime())
      .map(({ dateTime, ...m }) => m);

    return NextResponse.json({
      notifications,
      announcements,
      profile: intern,
      meetings: upcomingMeetings,
      pastMeetings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
