import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const leaderboard = await prisma.internProfile.findMany({
      orderBy: { totalPoints: 'desc' },
    });
    return NextResponse.json(leaderboard);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
