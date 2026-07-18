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

    // Fetch all submissions from interns in the mentor's group
    const submissions = await prisma.weeklySubmission.findMany({
      where: {
        intern: { group: mentorProfile.group },
        domainProjectAssignmentId: { not: null },
      },
      include: {
        intern: true,
      },
      orderBy: { submissionTime: 'desc' },
    });

    return NextResponse.json(submissions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'MENTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { submissionId, status, mentorComment } = body;

    if (!submissionId || !status) {
      return NextResponse.json({ error: 'Submission ID and status are required' }, { status: 400 });
    }

    if (!['APPROVED', 'CORRECTION_REQUESTED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatedSubmission = await prisma.weeklySubmission.update({
      where: { id: submissionId },
      data: {
        status,
        mentorComment: mentorComment || null,
      },
      include: {
        intern: true,
      },
    });

    // Notify intern
    await prisma.notification.create({
      data: {
        userId: updatedSubmission.intern.userId,
        content: `Your mentor reviewed your Week ${updatedSubmission.weekNumber} submission for "${updatedSubmission.projectTitle || 'Project'}". Status: ${status}.`,
        type: 'FEEDBACK',
      },
    });

    return NextResponse.json(updatedSubmission);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
