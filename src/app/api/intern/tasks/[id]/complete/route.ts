import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id: taskAssignmentId } = await params;

  if (!session || session.user.role !== 'INTERN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const intern = await prisma.internProfile.findUnique({
      where: { userId: session.user.id },
      include: { mentor: true },
    });

    if (!intern) {
      return NextResponse.json({ error: 'Intern profile not found' }, { status: 404 });
    }

    const assignment = await prisma.taskAssignment.findUnique({
      where: { id: taskAssignmentId },
      include: { task: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Task assignment not found' }, { status: 404 });
    }

    if (assignment.status === 'COMPLETED') {
      return NextResponse.json({ message: 'Task already completed' });
    }

    const updated = await prisma.taskAssignment.update({
      where: { id: taskAssignmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Notify Mentor of task completion
    if (intern.mentor) {
      await prisma.notification.create({
        data: {
          userId: intern.mentor.userId,
          content: `Roll No ${intern.rollNo} (${intern.name}) has completed the assigned task: "${assignment.task.title}".`,
          type: 'TASK_COMPLETED',
        },
      });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
