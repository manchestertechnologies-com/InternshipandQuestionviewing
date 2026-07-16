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

    const submissions = await prisma.weeklySubmission.findMany({
      where: {
        intern: { group: mentorProfile.group },
      },
      orderBy: { submissionTime: 'desc' },
    });

    return NextResponse.json(submissions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
