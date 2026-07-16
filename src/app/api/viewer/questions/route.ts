import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'VIEWER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const questions = await prisma.question.findMany({
      where: { status: 'APPROVED' },
      include: {
        images: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(questions);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
