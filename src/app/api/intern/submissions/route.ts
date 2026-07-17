import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';

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

    let fileUrl = '';
    let fileName = '';

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      fileUrl = body.fileUrl;
      fileName = body.fileName;
    } else {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file || file.size === 0) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      // Upload to Cloudinary
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const { url } = await uploadToCloudinary(
        buffer,
        file.name,
        'manchester-tech/weekly-submissions'
      );
      fileUrl = url;
      fileName = file.name;
    }

    if (!fileUrl) {
      return NextResponse.json({ error: 'File upload failed or URL missing' }, { status: 400 });
    }

    const submission = await prisma.weeklySubmission.create({
      data: {
        internId: internProfile.id,
        studentName: internProfile.name,
        rollNumber: internProfile.rollNo.toString(),
        fileName,
        fileUrl,
      },
    });

    // Notify mentor
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
    console.error('Submission upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
