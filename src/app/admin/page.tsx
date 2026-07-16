import React from 'react';
import prisma from '@/lib/prisma';
import AdminDashboardCharts from '@/components/AdminDashboardCharts';
import { Users, ShieldAlert, FolderLock, Database, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0; // Disable caching to fetch real-time dashboard data

export default async function AdminDashboard() {
  const [
    totalInterns,
    totalMentors,
    totalViewers,
    totalQuestions,
    pendingQuestions,
    approvedQuestions,
    rejectedQuestions,
    correctionRequestedQuestions,
    topInterns,
    recentQuestions
  ] = await Promise.all([
    prisma.internProfile.count(),
    prisma.mentorProfile.count(),
    prisma.viewerProfile.count(),
    prisma.question.count(),
    prisma.question.count({ where: { status: 'PENDING' } }),
    prisma.question.count({ where: { status: 'APPROVED' } }),
    prisma.question.count({ where: { status: 'REJECTED' } }),
    prisma.question.count({ where: { status: 'CORRECTION_REQUESTED' } }),
    prisma.internProfile.findMany({
      orderBy: { totalPoints: 'desc' },
      take: 5,
    }),
    prisma.question.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { intern: true },
    })
  ]);

  // Chart status mapping
  const statusData = [
    { name: 'Pending', value: pendingQuestions },
    { name: 'Approved', value: approvedQuestions },
    { name: 'Rejected', value: rejectedQuestions },
    { name: 'Correction Requested', value: correctionRequestedQuestions },
  ];

  // Domain categorization
  const interns = await prisma.internProfile.findMany({
    select: { domain: true }
  });
  const domainMap: { [key: string]: number } = {};
  interns.forEach(i => {
    const d = i.domain || 'General';
    domainMap[d] = (domainMap[d] || 0) + 1;
  });
  const domainData = Object.entries(domainMap).map(([name, count]) => ({
    name,
    count
  }));

  const stats = [
    { label: 'Total Interns', value: totalInterns, icon: Users, color: 'text-blue-400' },
    { label: 'Total Mentors', value: totalMentors, icon: ShieldAlert, color: 'text-amber-400' },
    { label: 'Viewer Accounts', value: totalViewers, icon: FolderLock, color: 'text-purple-400' },
    { label: 'Total Questions', value: totalQuestions, icon: Database, color: 'text-brand-gold' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gold-gradient">Admin Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Manchester Technologies Consolidated Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="glass-panel p-6 rounded-2xl border border-brand-border flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-brand-muted">{stat.label}</p>
                <p className="text-3xl font-bold mt-1 text-white">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Component */}
      <AdminDashboardCharts statusData={statusData} domainData={domainData} />

      {/* Leaderboard and Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-brand-text">Top Performing Interns</h2>
            <Link href="/admin/students" className="text-xs text-brand-gold hover:underline">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-border text-brand-muted font-medium">
                  <th className="pb-3">Rank</th>
                  <th className="pb-3">Roll No</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Domain</th>
                  <th className="pb-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {topInterns.map((intern, index) => (
                  <tr key={intern.id} className="text-zinc-300">
                    <td className="py-3 font-semibold text-brand-gold">#{index + 1}</td>
                    <td className="py-3">{intern.rollNo}</td>
                    <td className="py-3 text-white font-medium">{intern.name}</td>
                    <td className="py-3 text-xs">{intern.domain}</td>
                    <td className="py-3 text-right text-brand-gold font-semibold">{intern.totalPoints} pts</td>
                  </tr>
                ))}
                {topInterns.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-brand-muted text-sm italic">
                      No interns synced yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="glass-panel p-6 rounded-2xl border border-brand-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-brand-text">Recent Question Submissions</h2>
            <Link href="/admin/questions" className="text-xs text-brand-gold hover:underline">
              View Repository
            </Link>
          </div>

          <div className="space-y-4">
            {recentQuestions.map((q) => (
              <div key={q.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-brand-border text-sm">
                <div>
                  <p className="font-medium text-white max-w-md truncate">{q.questionText}</p>
                  <p className="text-xs text-brand-muted mt-1">
                    Submitted by <span className="text-zinc-300 font-semibold">{q.intern.name}</span> in <span className="text-brand-gold">{q.subject}</span>
                  </p>
                </div>
                <div className="text-right ml-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    q.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                    q.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                    q.status === 'CORRECTION_REQUESTED' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-zinc-500/10 text-zinc-400'
                  }`}>
                    {q.status}
                  </span>
                  <p className="text-[10px] text-brand-muted mt-1">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {recentQuestions.length === 0 && (
              <div className="py-8 text-center text-brand-muted text-sm italic">
                No questions submitted yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
