import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import React from 'react';
import Image from 'next/image';
import InternNav from '@/components/InternNav';
import prisma from '@/lib/prisma';
import { Award, Trophy, Star, TrendingUp } from 'lucide-react';

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
      <aside className="w-80 glass-panel border-l border-brand-border flex flex-col h-full shrink-0 p-6 space-y-8 bg-black/40">
        <div className="border-b border-brand-border pb-4">
          <h2 className="font-bold text-sm uppercase tracking-widest text-brand-gold">My Performance</h2>
          <p className="text-[10px] text-brand-muted mt-1 uppercase font-semibold">Real-Time Metrics</p>
        </div>

        <div className="space-y-6">
          {/* Rank */}
          <div className="flex items-center gap-4 bg-black/50 border border-brand-border p-4 rounded-xl">
            <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-xl border border-brand-gold/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-brand-muted uppercase font-bold">Global Rank</p>
              <p className="text-xl font-bold text-white mt-0.5">#{profile.rank || '-'}</p>
            </div>
          </div>

          {/* Total Points */}
          <div className="flex items-center gap-4 bg-black/50 border border-brand-border p-4 rounded-xl">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-brand-muted uppercase font-bold">Total Points</p>
              <p className="text-xl font-bold text-white mt-0.5">{profile.totalPoints} pts</p>
            </div>
          </div>

          {/* Mentor Score */}
          <div className="flex items-center gap-4 bg-black/50 border border-brand-border p-4 rounded-xl">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Star className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-brand-muted uppercase font-bold">Mentor Score</p>
              <p className="text-xl font-bold text-white mt-0.5">{profile.mentorScore ? `${profile.mentorScore}/10` : 'N/A'}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-black/50 border border-brand-border p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-brand-muted uppercase font-bold">Task Progress</p>
                <p className="text-xl font-bold text-white mt-0.5">{progressPercent}%</p>
              </div>
            </div>
            
            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-brand-gold h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
