'use client';

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, RefreshCw, Clock } from 'lucide-react';

interface WeeklySubmission {
  id: string;
  studentName: string;
  rollNumber: string;
  fileName: string;
  fileUrl: string;
  submissionTime: string;
}

export default function MentorSubmissionsPage() {
  const [submissions, setSubmissions] = useState<WeeklySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mentor/submissions');
      if (!res.ok) throw new Error('Failed to load submissions');
      const data = await res.json();
      setSubmissions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gold-gradient">Weekly Deliverables</h1>
        <p className="text-zinc-400 text-sm mt-1">Review and download weekly project updates submitted by interns</p>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-brand-border text-brand-muted font-medium">
                  <th className="pb-3">Roll Number</th>
                  <th className="pb-3">Student Name</th>
                  <th className="pb-3">Submission File</th>
                  <th className="pb-3">Upload Timestamp</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/5 transition-colors text-zinc-300">
                    <td className="py-3.5 font-semibold text-white">#{sub.rollNumber}</td>
                    <td className="py-3.5 text-white font-medium">{sub.studentName}</td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2 max-w-xs truncate font-mono text-xs">
                        <FileSpreadsheet className="w-4 h-4 text-brand-gold shrink-0" />
                        <span className="truncate">{sub.fileName}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-xs text-brand-muted">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(sub.submissionTime).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <a
                        href={sub.fileUrl}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-brand-border hover:bg-zinc-800 rounded-lg text-xs font-semibold text-brand-gold transition cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </a>
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-brand-muted italic">
                      No weekly submissions uploaded yet
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
