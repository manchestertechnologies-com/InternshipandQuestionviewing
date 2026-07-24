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

    // 2. Delete task assignments and tasks
    const taCount = await prisma.taskAssignment.deleteMany({});
    const tCount = await prisma.task.deleteMany({});

    // 3. Delete weekly submissions, domain project assignments, domain projects
    const wsCount = await prisma.weeklySubmission.deleteMany({});
    const dpaCount = await prisma.domainProjectAssignment.deleteMany({});
    const dpCount = await prisma.domainProject.deleteMany({});

    // 4. Delete meetings and meeting targets
    const mtCount = await prisma.meetingTarget.deleteMany({});
    const mCount = await prisma.meeting.deleteMany({});

    // 5. Delete problem statements
    const psCount = await prisma.problemStatement.deleteMany({});

    // 6. Delete communications & notifications
    const msgCount = await prisma.message.deleteMany({});
    const notifCount = await prisma.notification.deleteMany({});
    const annCount = await prisma.announcement.deleteMany({});

    // 7. Reset all intern profiles performance metrics
    const resetInterns = await prisma.internProfile.updateMany({
      data: {
        totalPoints: 0,
        mentorScore: 0,
        progress: 0,
        rank: 0,
      },
    });

    return NextResponse.json({
      message: 'Database cleanup completed successfully!',
      stats: {
        questionImages: qiCount.count,
        questions: qCount.count,
        taskAssignments: taCount.count,
        tasks: tCount.count,
        weeklySubmissions: wsCount.count,
        domainProjectAssignments: dpaCount.count,
        domainProjects: dpCount.count,
        meetingTargets: mtCount.count,
        meetings: mCount.count,
        problemStatements: psCount.count,
        messages: msgCount.count,
        notifications: notifCount.count,
        announcements: annCount.count,
        resetInternsCount: resetInterns.count,
      },
    });
  } catch (err: any) {
    console.error('Error during admin database cleanup:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
