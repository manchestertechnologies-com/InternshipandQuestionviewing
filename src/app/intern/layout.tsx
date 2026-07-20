import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import React from 'react';
import Image from 'next/image';
import InternNav from '@/components/InternNav';
import RightSidebar from '@/components/RightSidebar';
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
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Left Sidebar Menu */}
      <aside className="w-64 glass-panel border-r border-brand-border flex flex-col h-full shrink-0">
        <div className="p-6 border-b border-brand-border flex items-center gap-3">
          <Image
            src="/logo.jpg"
            alt="Manchester Technologies"
            width={40}
            height={40}
            className="rounded-full border border-brand-gold/30"
          />
          <div>
            <h1 className="font-bold text-sm tracking-wide text-gold-gradient">Manchester Tech</h1>
            <p className="text-[10px] text-brand-muted uppercase font-bold tracking-widest">Intern Portal</p>
          </div>
        </div>
        
        <InternNav />
      </aside>

      {/* Center Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-zinc-950 p-8 relative">
        {/* Absolute Background Logo in Center of Layout */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
          <Image
            src="/logo.jpg"
            alt="Manchester Technologies Watermark"
            width={450}
            height={450}
            className="opacity-[0.04] select-none"
          />
        </div>
        
        <div className="relative z-10 flex flex-col h-full">
          {children}
        </div>
      </main>

      {/* Right Sidebar Metrics */}
      <RightSidebar
        rank={dynamicRank}
        totalPoints={profile.totalPoints}
        mentorScore={profile.mentorScore}
        progressPercent={progressPercent}
      />
    </div>
  );
}
