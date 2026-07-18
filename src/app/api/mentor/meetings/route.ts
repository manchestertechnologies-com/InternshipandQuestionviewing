import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'MENTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
    }

    const meetings = await prisma.meeting.findMany({
      where: { mentorId: mentorProfile.id },
      include: {
        targets: {
          include: {
            intern: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(meetings);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'MENTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      meetLink,
      date,
      time,
      meetingType,
      instructions,
      scope, // "ALL", "INDIVIDUALS", "FILTER"
      internIds, // array of intern profile ids if INDIVIDUALS
      targetDomain, // string if FILTER
      targetDuration, // string if FILTER ("All" or specific)
    } = body;

    if (!title || !meetLink || !date || !time || !meetingType || !scope) {
      return NextResponse.json({ error: 'Missing required meeting details' }, { status: 400 });
    }

    const meetingDateTime = new Date(`${date}T${time}:00`);
    if (meetingDateTime < new Date()) {
      return NextResponse.json({ error: 'Meeting date/time cannot be in the past' }, { status: 400 });
    }

    // Resolve target interns under this mentor's group
    let targetedInternIds: string[] = [];

    if (scope === 'ALL') {
      const groupInterns = await prisma.internProfile.findMany({
        where: { group: mentorProfile.group },
        select: { id: true },
      });
      targetedInternIds = groupInterns.map((i) => i.id);
    } else if (scope === 'INDIVIDUALS') {
      if (!internIds || !Array.isArray(internIds) || internIds.length === 0) {
        return NextResponse.json({ error: 'Please select at least one intern' }, { status: 400 });
      }
      targetedInternIds = internIds;
    } else if (scope === 'FILTER') {
      if (!targetDomain) {
        return NextResponse.json({ error: 'Please select a target domain for the filter' }, { status: 400 });
      }
      
      const filterConditions: any = {
        group: mentorProfile.group,
        domain: targetDomain,
      };

      if (targetDuration && targetDuration !== 'All') {
        filterConditions.duration = targetDuration;
      }

      const matchedInterns = await prisma.internProfile.findMany({
        where: filterConditions,
        select: { id: true },
      });
      targetedInternIds = matchedInterns.map((i) => i.id);
    }

    if (targetedInternIds.length === 0) {
      return NextResponse.json({ error: 'No interns matched the selected targeting criteria' }, { status: 400 });
    }

    // 1. Create the Meeting
    const meeting = await prisma.meeting.create({
      data: {
        title,
        meetLink,
        date,
        time,
        meetingType,
        instructions: instructions || null,
        mentorId: mentorProfile.id,
      },
    });

    // 2. Create Meeting Targets & Notifications
    for (const internId of targetedInternIds) {
      const target = await prisma.meetingTarget.create({
        data: {
          meetingId: meeting.id,
          internId,
        },
        include: {
          intern: true,
        },
      });

      // Send notification to the intern
      await prisma.notification.create({
        data: {
          userId: target.intern.userId,
          content: `New Google Meet scheduled: "${title}" by ${mentorProfile.name} on ${date} at ${time}.`,
          type: 'ANNOUNCEMENT',
        },
      });
    }

    return NextResponse.json(meeting);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
