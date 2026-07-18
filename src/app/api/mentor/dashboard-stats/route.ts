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
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
    }

    const groupName = mentorProfile.group;

    // 1. Daily Tasks Pending and Completed (for interns in this mentor's group)
    const dailyTasksPending = await prisma.taskAssignment.count({
      where: {
        intern: { group: groupName },
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
      },
    });

    const dailyTasksCompleted = await prisma.taskAssignment.count({
      where: {
        intern: { group: groupName },
        status: 'COMPLETED',
      },
    });

    // 2. Active Domain Projects (projects created by this mentor)
    const activeDomainProjects = await prisma.domainProject.count({
      where: { mentorId: mentorProfile.id },
    });

    // 3. Weekly Reports Pending Review
    const weeklyReportsPendingReview = await prisma.weeklySubmission.count({
      where: {
        intern: { group: groupName },
        domainProjectAssignmentId: { not: null },
        status: 'PENDING',
      },
    });

    // 4. Upcoming Meetings (all future meetings or today's meetings)
    // Format today as YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingMeetings = await prisma.meeting.count({
      where: {
        mentorId: mentorProfile.id,
        date: { gte: todayStr },
      },
    });

    // 5. Questions Pending Review (questions submitted by group interns)
    const questionsPendingReview = await prisma.question.count({
      where: {
        intern: { group: groupName },
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      dailyTasksPending,
      dailyTasksCompleted,
      activeDomainProjects,
      weeklyReportsPendingReview,
      upcomingMeetings,
      questionsPendingReview,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
