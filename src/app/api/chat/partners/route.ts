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
    const role = session.user.role;

    if (role === 'MENTOR') {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!mentorProfile) {
        return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
      }

      // Return all interns in this group
      const interns = await prisma.internProfile.findMany({
        where: { group: mentorProfile.group },
        include: {
          user: { select: { email: true } },
        },
      });

      return NextResponse.json(
        interns.map((i) => ({
          id: i.userId, // User ID is the communication key
          name: i.name,
          role: 'INTERN',
          email: i.user.email,
          extra: `Roll #${i.rollNo} • ${i.domain || 'General'}`,
        }))
      );
    } else if (role === 'INTERN') {
      const internProfile = await prisma.internProfile.findUnique({
        where: { userId: session.user.id },
        include: {
          mentor: {
            include: {
              user: { select: { email: true } },
            },
          },
        },
      });

      if (!internProfile) {
        return NextResponse.json({ error: 'Intern profile not found' }, { status: 404 });
      }

      if (!internProfile.mentor) {
        return NextResponse.json([]); // Empty if no mentor is assigned yet
      }

      return NextResponse.json([
        {
          id: internProfile.mentor.userId,
          name: internProfile.mentor.name,
          role: 'MENTOR',
          email: internProfile.mentor.user.email,
          extra: `${internProfile.mentor.group} Mentor`,
        },
      ]);
    }

    return NextResponse.json([]); // Admins/Viewers do not chat
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
