import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const mentors = await prisma.mentorProfile.findMany({
      include: {
        user: { select: { email: true } },
        _count: { select: { interns: true } },
      },
    });
    return NextResponse.json(mentors);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
