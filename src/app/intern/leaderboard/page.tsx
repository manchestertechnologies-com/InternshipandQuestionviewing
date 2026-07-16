'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Award, RefreshCw, Star } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Intern {
  id: string;
  userId: string;
  rollNo: number;
  name: string;
  domain: string | null;
  totalPoints: number;
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/intern/leaderboard');
      if (!res.ok) throw new Error('Failed to load leaderboard standings');
      const data = await res.json();
      setLeaderboard(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gold-gradient">Leaderboard Standings</h1>
        <p className="text-zinc-400 text-sm mt-1">Review active intern rankings based on points earned from verified questions</p>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-gold" />
        </div>
      ) : (
        <div className="glass-panel p-6 rounded-2xl border border-brand-border">
          {/* Top 3 podium highlight */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-10 text-center items-end">
              {/* 2nd Place */}
              <div className="space-y-2">
                <div className="flex justify-center text-zinc-400">
                  <Trophy className="w-8 h-8" />
                </div>
                <div className="glass-panel p-4 rounded-xl border-zinc-700 bg-zinc-900/30">
                  <p className="text-xs text-brand-muted uppercase font-bold">2nd Place</p>
                  <p className="font-bold text-sm text-white mt-1 truncate">{leaderboard[1].name}</p>
                  <p className="text-xs text-brand-gold mt-1 font-semibold">{leaderboard[1].totalPoints} pts</p>
                </div>
              </div>

              {/* 1st Place */}
              <div className="space-y-2">
                <div className="flex justify-center text-brand-gold animate-bounce">
                  <Trophy className="w-12 h-12" />
                </div>
                <div className="glass-panel p-5 rounded-xl border-brand-gold/40 bg-brand-gold/5 ring-1 ring-brand-gold/30">
                  <p className="text-xs text-brand-gold uppercase font-black tracking-wider">Champion</p>
                  <p className="font-extrabold text-base text-white mt-1 truncate">{leaderboard[0].name}</p>
                  <p className="text-sm text-brand-gold mt-1 font-black">{leaderboard[0].totalPoints} pts</p>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="space-y-2">
                <div className="flex justify-center text-amber-700">
                  <Trophy className="w-8 h-8" />
                </div>
                <div className="glass-panel p-4 rounded-xl border-amber-900/40 bg-amber-950/10">
                  <p className="text-xs text-brand-muted uppercase font-bold">3rd Place</p>
                  <p className="font-bold text-sm text-white mt-1 truncate">{leaderboard[2].name}</p>
                  <p className="text-xs text-brand-gold mt-1 font-semibold">{leaderboard[2].totalPoints} pts</p>
                </div>
              </div>
            </div>
          )}

          {/* Standings Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-border text-brand-muted font-medium">
                  <th className="pb-3">Rank</th>
                  <th className="pb-3">Roll Number</th>
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3">Domain / Specialization</th>
                  <th className="pb-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {leaderboard.map((item, index) => {
                  const isCurrent = item.userId === session?.user?.id;
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-white/5 transition-colors ${
                        isCurrent ? 'bg-brand-gold/5 font-semibold text-white border-y border-brand-gold/20' : 'text-zinc-300'
                      }`}
                    >
                      <td className="py-4 font-bold">
                        <span className={`inline-flex items-center gap-1 ${
                          index === 0 ? 'text-brand-gold' : index === 1 ? 'text-zinc-400' : index === 2 ? 'text-amber-700' : 'text-zinc-500'
                        }`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="py-4 font-mono text-xs">#{item.rollNo}</td>
                      <td className="py-4 flex items-center gap-2">
                        <span>{item.name}</span>
                        {isCurrent && (
                          <span className="text-[9px] uppercase tracking-wider font-extrabold bg-brand-gold text-black px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-xs font-medium">{item.domain || 'General'}</td>
                      <td className="py-4 text-right text-brand-gold font-bold">{item.totalPoints} pts</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
