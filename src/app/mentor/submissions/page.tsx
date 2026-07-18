'use client';

import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Clock, CheckCircle, AlertTriangle, FileText, Send, X } from 'lucide-react';

interface WeeklySubmission {
  id: string;
  studentName: string;
  rollNumber: string;
  fileName: string;
  fileUrl: string;
  submissionTime: string;
  domain: string | null;
  duration: string | null;
  projectTitle: string | null;
  weekNumber: number | null;
  status: string; // "PENDING", "APPROVED", "CORRECTION_REQUESTED"
  mentorComment: string | null;
}

export default function MentorSubmissionsPage() {
  const [submissions, setSubmissions] = useState<WeeklySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Review states
  const [selectedSub, setSelectedSub] = useState<WeeklySubmission | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mentor/weekly-reports');
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

  const handleReview = async (status: 'APPROVED' | 'CORRECTION_REQUESTED') => {
    if (!selectedSub) return;
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/mentor/weekly-reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: selectedSub.id,
          status,
          mentorComment: comment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update submission');

      setSuccess(`Weekly submission review saved as ${status}!`);
      setSelectedSub(null);
      setComment('');
      fetchSubmissions();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gold-gradient">Weekly Reports</h1>
        <p className="text-zinc-400 text-sm mt-1">Review, comment, approve, or request corrections for weekly progress reports submitted by interns</p>
      </div>

      {success && (
        <div className="bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-lg text-sm text-center">
          {success}
        </div>
      )}

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
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-brand-muted font-medium">
                  <th className="pb-3 text-xs uppercase tracking-wider">Intern Details</th>
                  <th className="pb-3 text-xs uppercase tracking-wider">Project & Domain</th>
                  <th className="pb-3 text-xs uppercase tracking-wider text-center">Week</th>
                  <th className="pb-3 text-xs uppercase tracking-wider">Submission File</th>
                  <th className="pb-3 text-xs uppercase tracking-wider text-center">Status</th>
                  <th className="pb-3 text-xs uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/5 transition-colors text-zinc-300">
                    <td className="py-4">
                      <p className="font-semibold text-white">#{sub.rollNumber} - {sub.studentName}</p>
                      <p className="text-[10px] text-brand-muted mt-0.5">Duration: {sub.duration || 'N/A'}</p>
                    </td>
                    <td className="py-4">
                      <p className="text-white font-medium truncate max-w-[200px]">{sub.projectTitle || 'N/A'}</p>
                      <p className="text-[10px] text-brand-gold font-bold uppercase tracking-wider mt-0.5">{sub.domain || 'N/A'}</p>
                    </td>
                    <td className="py-4 text-center font-bold text-white text-base">
                      W{sub.weekNumber || '?' }
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2 max-w-xs truncate font-mono text-xs mb-1">
                        <FileText className="w-4 h-4 text-brand-gold shrink-0" />
                        <span className="truncate">{sub.fileName}</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[10px] text-brand-muted">
                        <Clock className="w-3 h-3" />
                        {new Date(sub.submissionTime).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        sub.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : sub.status === 'CORRECTION_REQUESTED'
                          ? 'bg-amber-500/10 text-amber-400 border border-brand-gold/20'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {sub.status === 'APPROVED' ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Approved
                          </>
                        ) : sub.status === 'CORRECTION_REQUESTED' ? (
                          <>
                            <AlertTriangle className="w-3 h-3" /> Correction
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3" /> Pending
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 text-right space-y-1">
                      <div className="flex justify-end gap-2">
                        <a
                          href={sub.fileUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-zinc-950 border border-brand-border hover:bg-zinc-900 rounded text-xs font-semibold text-brand-gold transition cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                        <button
                          onClick={() => {
                            setSelectedSub(sub);
                            setComment(sub.mentorComment || '');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-brand-gold hover:bg-brand-gold-hover rounded text-xs font-bold text-black transition cursor-pointer border-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                      </div>
                      {sub.mentorComment && (
                        <p className="text-[10px] text-brand-muted text-right italic truncate max-w-[200px]">
                          Feedback: "{sub.mentorComment}"
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
                {submissions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-brand-muted italic">
                      No weekly project reports submitted yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-brand-border overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-brand-border flex justify-between items-center bg-black/40">
              <div className="flex items-center gap-2 text-brand-gold">
                <Send className="w-5 h-5" />
                <h2 className="font-bold text-lg text-white">Review Weekly Report</h2>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="text-zinc-500 hover:text-white transition cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-brand-border text-xs space-y-1">
                <p className="text-zinc-400">Intern: <strong className="text-white">{selectedSub.studentName} (Roll #{selectedSub.rollNumber})</strong></p>
                <p className="text-zinc-400">Project: <strong className="text-white">{selectedSub.projectTitle}</strong></p>
                <p className="text-zinc-400">Week: <strong className="text-white">Week {selectedSub.weekNumber}</strong></p>
                <p className="text-zinc-400">File: <a href={selectedSub.fileUrl} download target="_blank" rel="noopener noreferrer" className="text-brand-gold font-semibold underline hover:text-brand-gold-hover truncate block mt-1">{selectedSub.fileName}</a></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Mentor Review Feedback / Comment
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                  placeholder="Enter notes, corrections needed, or approval feedback..."
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => handleReview('CORRECTION_REQUESTED')}
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/30 text-rose-300 text-sm font-semibold transition cursor-pointer"
                >
                  Request Correction
                </button>
                <button
                  type="button"
                  onClick={() => handleReview('APPROVED')}
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-sm font-bold transition cursor-pointer border-0"
                >
                  Approve Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
