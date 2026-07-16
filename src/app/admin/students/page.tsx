'use client';

import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, AlertTriangle, CheckCircle, Database } from 'lucide-react';

interface Intern {
  id: string;
  rollNo: number;
  name: string;
  phoneNumber: string | null;
  domain: string | null;
  group: string;
  collegeName: string | null;
  course: string | null;
  applicationID: string | null;
  status: string | null;
  totalPoints: number;
}

export default function StudentsManagement() {
  const [students, setStudents] = useState<Intern[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any | null>(null);
  const [error, setError] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/students');
      if (!res.ok) throw new Error('Failed to load students');
      const data = await res.json();
      setStudents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    setError('');

    try {
      const res = await fetch('/api/admin/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync Excel data');
      setSyncResult(data);
      // Reload students
      fetchStudents();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      (s.domain && s.domain.toLowerCase().includes(term)) ||
      s.group.toLowerCase().includes(term) ||
      (s.phoneNumber && s.phoneNumber.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gold-gradient">Interns Management</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage, search, and synchronize student records</p>
        </div>

        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center justify-center gap-2 py-2.5 px-5 bg-brand-gold text-black hover:bg-brand-gold-hover disabled:opacity-50 font-semibold rounded-lg shadow-lg shadow-brand-gold/15 transition duration-200 cursor-pointer btn-gold shrink-0 border-0"
        >
          {syncing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Syncing Excel...</span>
            </>
          ) : (
            <>
              <Database className="w-5 h-5" />
              <span>Sync Excel Data</span>
            </>
          )}
        </button>
      </div>

      {/* Sync Outcomes Overlay/Box */}
      {syncResult && (
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Synchronization Successful</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-white/5 rounded-lg border border-brand-border">
              <p className="text-xs text-brand-muted">Total Rows</p>
              <p className="text-2xl font-bold text-white">{syncResult.total}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-brand-border">
              <p className="text-xs text-brand-muted">Created (New)</p>
              <p className="text-2xl font-bold text-emerald-400">+{syncResult.created}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-brand-border">
              <p className="text-xs text-brand-muted">Updated (Modified)</p>
              <p className="text-2xl font-bold text-amber-400">~{syncResult.updated}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-lg border border-brand-border">
              <p className="text-xs text-brand-muted">Skipped (Identical)</p>
              <p className="text-2xl font-bold text-brand-gold">{syncResult.skipped}</p>
            </div>
          </div>

          {syncResult.errors && syncResult.errors.length > 0 && (
            <div className="mt-4 border-t border-brand-border pt-4">
              <p className="text-xs font-semibold text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Warnings/Errors during sync ({syncResult.errors.length}):
              </p>
              <ul className="text-xs text-brand-muted list-disc list-inside mt-2 max-h-32 overflow-y-auto space-y-1">
                {syncResult.errors.map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {/* Filters and List */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-6">
        <div className="flex items-center gap-3 bg-black/40 border border-brand-border px-4 py-2.5 rounded-lg w-full max-w-md">
          <Search className="w-5 h-5 text-brand-muted" />
          <input
            type="text"
            placeholder="Search by name, domain, group..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-white placeholder-zinc-500 focus:outline-none text-sm w-full"
          />
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <RefreshCw className="w-8 h-8 animate-spin text-brand-gold" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-border text-brand-muted font-medium">
                  <th className="pb-3">Roll No</th>
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3">Domain</th>
                  <th className="pb-3">Group</th>
                  <th className="pb-3">College Name</th>
                  <th className="pb-3">Course</th>
                  <th className="pb-3">Application ID</th>
                  <th className="pb-3 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-white/5 transition-colors text-zinc-300">
                    <td className="py-3.5 font-semibold text-white">#{student.rollNo}</td>
                    <td className="py-3.5 text-white font-medium">{student.name}</td>
                    <td className="py-3.5 text-xs font-mono">{student.domain || 'N/A'}</td>
                    <td className="py-3.5 text-xs">{student.group}</td>
                    <td className="py-3.5 text-xs truncate max-w-xs">{student.collegeName || 'N/A'}</td>
                    <td className="py-3.5 text-xs">{student.course || 'N/A'}</td>
                    <td className="py-3.5 text-xs font-mono">{student.applicationID || 'N/A'}</td>
                    <td className="py-3.5 text-right font-semibold text-brand-gold">
                      {student.totalPoints} pts
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-brand-muted italic">
                      No interns found matching the criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
