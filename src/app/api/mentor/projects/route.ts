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

    const projects = await prisma.domainProject.findMany({
      where: { mentorId: mentorProfile.id },
      include: {
        assignments: {
          include: {
            intern: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(projects);
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
      domain,
      problemStatement,
      description,
      technologies,
      expectedOutcome,
      duration,
      startDate,
      finalDeadline,
      weeklyMilestones,
      instructions,
      fileUrl,
      fileName,
      internIds,
    } = body;

    if (!title || !domain || !problemStatement || !duration || !startDate || !finalDeadline || !internIds || !Array.isArray(internIds) || internIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields or no interns selected' }, { status: 400 });
    }

    const project = await prisma.domainProject.create({
      data: {
        title,
        domain,
        problemStatement,
        description: description || null,
        technologies: technologies || null,
        expectedOutcome: expectedOutcome || null,
        duration,
        startDate: new Date(startDate),
        finalDeadline: new Date(finalDeadline),
        weeklyMilestones: weeklyMilestones || null,
        instructions: instructions || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        mentorId: mentorProfile.id,
      },
    });

    // Fetch intern profiles to map user IDs
    const interns = await prisma.internProfile.findMany({
      where: { id: { in: internIds } },
      select: { id: true, userId: true },
    });

    const assignmentData = internIds.map((internId) => ({
      projectId: project.id,
      internId,
      status: 'ASSIGNED',
      progress: 0,
    }));

    await prisma.domainProjectAssignment.createMany({
      data: assignmentData,
    });

    const notificationData = interns.map((intern) => ({
      userId: intern.userId,
      content: `Your mentor assigned a new Domain Project: "${title}". Check the Domain Project tab.`,
      type: 'ANNOUNCEMENT',
    }));

    if (notificationData.length > 0) {
      await prisma.notification.createMany({
        data: notificationData,
      });
    }

    return NextResponse.json(project);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
