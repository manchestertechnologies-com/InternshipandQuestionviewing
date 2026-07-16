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

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { difficulty, status, reviewFeedback } = body;

    // Verify authorized roles
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MENTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Retrieve question and check group permissions
    const question = await prisma.question.findUnique({
      where: { id },
      include: { intern: true },
    });

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    if (session.user.role === 'MENTOR') {
      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: session.user.id },
      });

      if (!mentorProfile || question.intern.group !== mentorProfile.group) {
        return NextResponse.json({ error: 'Unauthorized to modify questions outside your group' }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (difficulty !== undefined) {
      if (session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only administrators can update difficulty levels' }, { status: 403 });
      }
      updateData.difficulty = difficulty;
    }

    if (status !== undefined) {
      updateData.status = status;
      
      // Auto-award points to the intern if the status changes to APPROVED
      if (status === 'APPROVED') {
        const question = await prisma.question.findUnique({
          where: { id },
          select: { internId: true, status: true, difficulty: true },
        });

        if (question && question.status !== 'APPROVED') {
          // Determine points based on difficulty if set, otherwise default 10 pts
          let points = 10;
          if (question.difficulty === 'Medium') points = 15;
          else if (question.difficulty === 'Hard') points = 20;

          await prisma.internProfile.update({
            where: { id: question.internId },
            data: {
              totalPoints: { increment: points },
            },
          });
        }
      }
    }

    if (reviewFeedback !== undefined) {
      updateData.reviewFeedback = reviewFeedback;
    }

    const updated = await prisma.question.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
