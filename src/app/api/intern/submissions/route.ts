import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'INTERN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const internProfile = await prisma.internProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!internProfile) {
      return NextResponse.json({ error: 'Intern profile not found' }, { status: 404 });
    }

    const submissions = await prisma.weeklySubmission.findMany({
      where: { internId: internProfile.id },
      orderBy: { submissionTime: 'desc' },
    });

    return NextResponse.json(submissions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'INTERN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const internProfile = await prisma.internProfile.findUnique({
      where: { userId: session.user.id },
      include: { mentor: true },
    });

    if (!internProfile) {
      return NextResponse.json({ error: 'Intern profile not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const fileUrl = `data:${file.type};base64,${base64}`;

    // Create WeeklySubmission
    const submission = await prisma.weeklySubmission.create({
      data: {
        internId: internProfile.id,
        studentName: internProfile.name,
        rollNumber: internProfile.rollNo.toString(),
        fileName: file.name,
        fileUrl,
      },
    });

    // Notify Mentor of new submission
    if (internProfile.mentor) {
      await prisma.notification.create({
        data: {
          userId: internProfile.mentor.userId,
          content: `Roll No ${internProfile.rollNo} (${internProfile.name}) has uploaded their weekly submission.`,
          type: 'SUBMISSION',
        },
      });
    }

    return NextResponse.json(submission);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
