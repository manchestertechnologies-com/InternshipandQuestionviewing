'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, RefreshCw } from 'lucide-react';

interface Intern {
  id: string;
  userId: string;
  rollNo: number;
  name: string;
  domain: string | null;
  totalPoints: number;
  group: string;
}

export default function MentorLeaderboardPage() {
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
        <p className="text-zinc-400 text-sm mt-1">Global standings of all active interns based on points earned</p>
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
          {/* Standings Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-border text-brand-muted font-medium">
                  <th className="pb-3 text-center w-16">Rank</th>
                  <th className="pb-3">Roll No</th>
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3">Domain</th>
                  <th className="pb-3">Group</th>
                  <th className="pb-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {leaderboard.map((intern, index) => (
                  <tr key={intern.id} className="hover:bg-white/5 transition-colors text-zinc-300">
                    <td className="py-3.5 text-center font-bold text-white">
                      {index === 0 ? (
                        <span className="text-brand-gold">🥇 1</span>
                      ) : index === 1 ? (
                        <span className="text-zinc-400">🥈 2</span>
                      ) : index === 2 ? (
                        <span className="text-amber-700">🥉 3</span>
                      ) : (
                        index + 1
                      )}
                    </td>
                    <td className="py-3.5 font-mono text-zinc-400">#{intern.rollNo}</td>
                    <td className="py-3.5 text-white font-medium">{intern.name}</td>
                    <td className="py-3.5 text-brand-muted">{intern.domain || 'N/A'}</td>
                    <td className="py-3.5 text-zinc-400">{intern.group}</td>
                    <td className="py-3.5 text-right font-bold text-brand-gold">{intern.totalPoints} pts</td>
                  </tr>
                ))}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-brand-muted italic">
                      No interns available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
