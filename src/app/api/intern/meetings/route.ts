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
    const intern = await prisma.internProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!intern) {
      return NextResponse.json({ error: 'Intern profile not found' }, { status: 404 });
    }

    // Get today's date formatted as YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];

    const targetMeetings = await prisma.meetingTarget.findMany({
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
    });

    const meetings = targetMeetings.map((tm) => ({
      id: tm.meeting.id,
      title: tm.meeting.title,
      meetLink: tm.meeting.meetLink,
      date: tm.meeting.date,
      time: tm.meeting.time,
      meetingType: tm.meeting.meetingType,
      instructions: tm.meeting.instructions,
      mentorName: tm.meeting.mentor.name,
    }));

    return NextResponse.json(meetings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
