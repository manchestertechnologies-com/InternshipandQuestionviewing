import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MENTOR')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (session.user.role === 'MENTOR') {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!mentorProfile) {
        return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
      }

      const questions = await prisma.question.findMany({
        where: {
          intern: { group: mentorProfile.group },
        },
        include: {
          intern: true,
          images: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(questions);
    }

    // Otherwise, Admin fetches all questions
    const questions = await prisma.question.findMany({
      include: {
        intern: true,
        images: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(questions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
