'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Award, Trophy, Star, TrendingUp } from 'lucide-react';

interface RightSidebarProps {
  rank: number;
  totalPoints: number;
  mentorScore: number | null;
  progressPercent: number;
}

export default function RightSidebar({ rank, totalPoints, mentorScore, progressPercent }: RightSidebarProps) {
  const pathname = usePathname();

  // The sidebar should only appear on the main intern dashboard (/intern)
  if (pathname !== '/intern') {
    return null;
  }

  return (
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
            <p className="text-xl font-bold text-white mt-0.5">#{rank || 1}</p>
          </div>
        </div>

        {/* Total Points */}
        <div className="flex items-center gap-4 bg-black/50 border border-brand-border p-4 rounded-xl">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-brand-muted uppercase font-bold">Total Points</p>
            <p className="text-xl font-bold text-white mt-0.5">{totalPoints} pts</p>
          </div>
        </div>

        {/* Mentor Score */}
        <div className="flex items-center gap-4 bg-black/50 border border-brand-border p-4 rounded-xl">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-brand-muted uppercase font-bold">Mentor Score</p>
            <p className="text-xl font-bold text-white mt-0.5">{mentorScore ? `${mentorScore}/10` : 'N/A'}</p>
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
  );
}
