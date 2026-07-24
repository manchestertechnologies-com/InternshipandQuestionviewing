import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import React from 'react';
import InternNav from '@/components/InternNav';
import RightSidebar from '@/components/RightSidebar';
import ResponsiveLayoutWrapper from '@/components/ResponsiveLayoutWrapper';
import prisma from '@/lib/prisma';

export const revalidate = 0; // Ensure data is loaded fresh on every navigation

export default async function InternLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'INTERN') {
    redirect('/');
  }

  // Fetch intern metrics
  const profile = await prisma.internProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    redirect('/');
  }

  // Calculate progress metrics
  const totalTasks = await prisma.taskAssignment.count({ where: { internId: profile.id } });
  const completedTasks = await prisma.taskAssignment.count({ where: { internId: profile.id, status: 'COMPLETED' } });
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate real-time dynamic global rank based on total points
  const higherScoringCount = await prisma.internProfile.count({
    where: { totalPoints: { gt: profile.totalPoints } },
  });
  const dynamicRank = higherScoringCount + 1;

  // Keep profile.rank field in database in sync
  if (profile.rank !== dynamicRank) {
    prisma.internProfile.update({
      where: { id: profile.id },
      data: { rank: dynamicRank },
    }).catch(() => {});
  }

  return (
    <ResponsiveLayoutWrapper
      title="Manchester Tech"
      subtitle="Intern Portal"
      navComponent={<InternNav />}
      rightSidebar={
        <RightSidebar
          rank={dynamicRank}
          totalPoints={profile.totalPoints}
          mentorScore={profile.mentorScore}
          progressPercent={progressPercent}
        />
      }
    >
      {children}
    </ResponsiveLayoutWrapper>
  );
}
