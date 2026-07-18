import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'INTERN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const intern = await prisma.internProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        mentor: true,
      },
    });

    if (!intern) {
      return NextResponse.json({ error: 'Intern profile not found' }, { status: 404 });
    }

    // Get the assigned project details
    const assignment = await prisma.domainProjectAssignment.findFirst({
      where: { internId: intern.id },
      include: {
        project: {
          include: {
            mentor: true,
          },
        },
        weeklySubmissions: {
          orderBy: { weekNumber: 'asc' },
        },
      },
    });

    return NextResponse.json({
      intern,
      assignment: assignment || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
