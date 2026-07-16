import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session || session.user.role !== 'MENTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, domain, group, score } = body;

    const currentProfile = await prisma.internProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!currentProfile) {
      return NextResponse.json({ error: 'Intern profile not found' }, { status: 404 });
    }

    // Process scoring action
    if (score !== undefined) {
      const numericScore = parseFloat(score);
      if (isNaN(numericScore) || numericScore < 1 || numericScore > 10) {
        return NextResponse.json({ error: 'Score must be between 1 and 10' }, { status: 400 });
      }

      // Increment points and update mentorScore
      const updated = await prisma.internProfile.update({
        where: { id },
        data: {
          mentorScore: numericScore,
          totalPoints: { increment: numericScore },
        },
      });

      // Send feedback notification to the intern
      await prisma.notification.create({
        data: {
          userId: currentProfile.userId,
          content: `Your mentor scored you ${numericScore}/10 for your performance!`,
          type: 'FEEDBACK',
        },
      });

      // Recalculate rankings based on total points
      const allInterns = await prisma.internProfile.findMany({
        orderBy: { totalPoints: 'desc' },
      });
      
      await prisma.$transaction(
        allInterns.map((intern, index) =>
          prisma.internProfile.update({
            where: { id: intern.id },
            data: { rank: index + 1 },
          })
        )
      );

      return NextResponse.json(updated);
    }

    // Process student profile details update
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (domain !== undefined) updateData.domain = domain;
    if (group !== undefined) {
      updateData.group = group;
      // Resolve new mentor ID if group changed
      const mentor = await prisma.mentorProfile.findFirst({
        where: { group: group.trim() },
      });
      updateData.mentorId = mentor?.id || null;
    }

    if (email !== undefined && email.trim().toLowerCase() !== currentProfile.user.email) {
      const cleanedEmail = email.trim().toLowerCase();
      // Check for duplicate emails
      const duplicate = await prisma.user.findUnique({
        where: { email: cleanedEmail },
      });
      if (duplicate) {
        return NextResponse.json({ error: 'Email ID already registered' }, { status: 400 });
      }

      // Update User email
      await prisma.user.update({
        where: { id: currentProfile.userId },
        data: { email: cleanedEmail },
      });
    }

    const updated = await prisma.internProfile.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
