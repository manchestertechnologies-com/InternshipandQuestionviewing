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
    const students = await prisma.internProfile.findMany({
      orderBy: { rollNo: 'asc' },
    });
    return NextResponse.json(students);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
