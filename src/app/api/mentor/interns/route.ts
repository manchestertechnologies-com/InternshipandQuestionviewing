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
    const groupName = session.user.group || '';
    const interns = await prisma.internProfile.findMany({
      where: { group: groupName },
      include: {
        user: { select: { email: true } },
      },
      orderBy: { rollNo: 'asc' },
    });
    return NextResponse.json(interns);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
