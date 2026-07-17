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

    const projects = await prisma.problemStatement.findMany({
      where: { group: mentorProfile.group },
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
    const { title, description, fileUrl, docUrl, docName, refUrl, refName } = body;

    if (!title || !fileUrl) {
      return NextResponse.json({ error: 'Title and Problem Statement document are required' }, { status: 400 });
    }

    const project = await prisma.problemStatement.create({
      data: {
        title,
        description: description || null,
        fileUrl,
        docUrl: docUrl || null,
        docName: docName || null,
        refUrl: refUrl || null,
        refName: refName || null,
        group: mentorProfile.group,
        uploadedBy: mentorProfile.name,
      },
    });

    // Notify all interns in the group
    const groupInterns = await prisma.internProfile.findMany({
      where: { group: mentorProfile.group },
    });

    for (const intern of groupInterns) {
      await prisma.notification.create({
        data: {
          userId: intern.userId,
          content: `Your mentor uploaded a new Domain Project: "${title}". Check the Domain Project tab.`,
          type: 'ANNOUNCEMENT',
        },
      });
    }

    return NextResponse.json(project);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
