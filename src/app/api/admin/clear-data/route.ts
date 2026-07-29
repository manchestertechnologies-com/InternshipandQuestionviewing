import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    // 1. Delete all question images and questions
    const qiCount = await prisma.questionImage.deleteMany({});
    const qCount = await prisma.question.deleteMany({});

    // 2. Delete task assignments and tasks (Questions tasks)
    const taCount = await prisma.taskAssignment.deleteMany({});
    const tCount = await prisma.task.deleteMany({});

    // NOTE: Domain projects, domain project assignments, weekly submissions,
    // meetings, and problem statements are strictly preserved as requested.

    // 3. Reset intern profile task progress & points for question tasks
    const resetInterns = await prisma.internProfile.updateMany({
      data: {
        totalPoints: 0,
        progress: 0,
      },
    });

    return NextResponse.json({
      message: 'Question database cleared successfully! Domain projects and intern project assignments were preserved.',
      stats: {
        questionImages: qiCount.count,
        questions: qCount.count,
        taskAssignments: taCount.count,
        tasks: tCount.count,
        resetInternsCount: resetInterns.count,
      },
    });
  } catch (err: any) {
    console.error('Error during admin database cleanup:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
