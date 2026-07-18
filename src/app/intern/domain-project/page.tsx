'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Calendar, Download, RefreshCw, FileText, Upload, Clock, CheckCircle2, AlertTriangle, MessageSquare, Info } from 'lucide-react';

interface Submission {
  id: string;
  fileName: string;
  fileUrl: string;
  submissionTime: string;
  weekNumber: number | null;
  status: string;
  mentorComment: string | null;
}

interface Project {
  id: string;
  title: string;
  domain: string;
  problemStatement: string;
  description: string | null;
  technologies: string | null;
  expectedOutcome: string | null;
  duration: string;
  startDate: string;
  finalDeadline: string;
  weeklyMilestones: string | null;
  instructions: string | null;
  fileUrl: string | null;
  fileName: string | null;
  mentor: {
    name: string;
  } | null;
}

interface Assignment {
  id: string;
  status: string;
  progress: number;
  project: Project;
  weeklySubmissions: Submission[];
}

interface InternProfile {
  id: string;
  name: string;
  rollNo: number;
  domain: string | null;
  duration: string | null;
  mentor: {
    name: string;
  } | null;
}

export default function DomainProjectPage() {
  const [intern, setIntern] = useState<InternProfile | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Submit states
  const [weekNumber, setWeekNumber] = useState('1');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProjectData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/intern/domain-project');
      if (!res.ok) throw new Error('Failed to load project details');
      const data = await res.json();
      setIntern(data.intern);
      setAssignment(data.assignment);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !assignment) return;

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      // 1. Get signature for Cloudinary upload
      const signRes = await fetch('/api/cloudinary/sign?folder=manchester-tech/weekly-submissions');
      if (!signRes.ok) throw new Error('Failed to generate upload signature');
      const signData = await signRes.json();
      const { signature, timestamp, folder, apiKey, cloudName } = signData;

      // 2. Resource Type check
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const resourceType = (ext === 'pdf' || ext === 'docx' || ext === 'doc' || ext === 'zip') ? 'raw' : 'auto';

      // 3. Upload to Cloudinary
      const cloudinaryData = new FormData();
      cloudinaryData.append('file', file);
      cloudinaryData.append('api_key', apiKey);
      cloudinaryData.append('timestamp', timestamp.toString());
      cloudinaryData.append('signature', signature);
      cloudinaryData.append('folder', folder);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        {
          method: 'POST',
          body: cloudinaryData,
        }
      );

      if (!cloudinaryRes.ok) {
        const errorData = await cloudinaryRes.json();
        throw new Error(errorData.error?.message || 'Cloudinary upload failed');
      }

      const uploadResult = await cloudinaryRes.json();
      const fileUrl = uploadResult.secure_url;

      // 4. Save metadata in DB
      const res = await fetch('/api/intern/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl,
          fileName: file.name,
          weekNumber,
          domainProjectAssignmentId: assignment.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit report');

      setSuccess(`Week ${weekNumber} progress report uploaded successfully!`);
      setFile(null);
      
      const fileInput = document.getElementById('report-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      fetchProjectData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-gold" />
      </div>
    );
  }

  // Helper to determine the current week based on start date
  const getCurrentWeek = (startDateStr: string) => {
    const start = new Date(startDateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.ceil(diffDays / 7);
    return Math.max(1, week);
  };

  const project = assignment?.project;
  const currentWeek = project ? getCurrentWeek(project.startDate) : 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gold-gradient">Domain Project</h1>
        <p className="text-zinc-400 text-sm mt-1">Manage and submit weekly reports for your specialized internship domain project</p>
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

      {!assignment ? (
        <div className="py-12 text-center text-brand-muted italic glass-panel rounded-2xl border border-brand-border space-y-4">
          <BookOpen className="w-12 h-12 text-zinc-600 mx-auto" />
          <p>No domain-based project has been assigned to you yet.</p>
          <p className="text-xs text-zinc-500">Projects are assigned by your mentor based on your domain ({intern?.domain || 'N/A'}) and duration ({intern?.duration || 'N/A'}).</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Project description & details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <span className="text-[10px] bg-brand-gold/10 border border-brand-gold/20 text-brand-gold px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  {project?.domain} Project
                </span>
                <span className="text-[10px] bg-white/5 border border-brand-border text-brand-muted px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  Duration: {project?.duration}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-white">{project?.title}</h2>
              
              <div className="text-xs text-brand-muted">
                Assigned by Mentor: <strong className="text-white">{project?.mentor?.name || 'Mentor'}</strong>
              </div>

              <div className="border-t border-brand-border/40 pt-4 space-y-3">
                <p className="text-xs uppercase font-bold tracking-wider text-brand-gold">Problem Statement</p>
                <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
                  {project?.problemStatement}
                </p>
              </div>

              {project?.description && (
                <div className="space-y-2">
                  <p className="text-xs uppercase font-bold tracking-wider text-brand-muted">Details / Scope</p>
                  <p className="text-zinc-400 text-sm whitespace-pre-wrap leading-relaxed">
                    {project.description}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {project?.technologies && (
                  <div className="p-3 bg-black/40 border border-brand-border rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-brand-muted">Technologies / Tools</p>
                    <p className="text-sm font-semibold text-white mt-1">{project.technologies}</p>
                  </div>
                )}
                {project?.expectedOutcome && (
                  <div className="p-3 bg-black/40 border border-brand-border rounded-xl">
                    <p className="text-[10px] uppercase font-bold text-brand-muted">Expected Outcome</p>
                    <p className="text-sm font-semibold text-white mt-1">{project.expectedOutcome}</p>
                  </div>
                )}
              </div>

              {project?.fileUrl && (
                <div className="flex items-center justify-between bg-black/40 border border-brand-border p-3 rounded-xl max-w-sm mt-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-5 h-5 text-brand-gold shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-white truncate font-medium">{project.fileName || 'Attachment'}</p>
                      <p className="text-[9px] text-brand-muted">Download Details</p>
                    </div>
                  </div>
                  <a
                    href={project.fileUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-zinc-950 hover:bg-zinc-900 border border-brand-border rounded text-brand-gold cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Milestones Card */}
            {project?.weeklyMilestones && (
              <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-brand-gold" />
                  <span>Weekly Milestones</span>
                </h3>
                <div className="bg-zinc-950/60 p-4 rounded-xl border border-brand-border text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
                  {project.weeklyMilestones}
                </div>
              </div>
            )}
          </div>

          {/* Report Submission & Side Panels */}
          <div className="space-y-6">
            {/* Status Panel */}
            <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
              <h3 className="font-bold text-white text-base">Timeline & Progress</h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-brand-border/40 pb-2">
                  <span className="text-brand-muted">Start Date:</span>
                  <span className="text-white font-medium">{project ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-brand-border/40 pb-2">
                  <span className="text-brand-muted">Final Deadline:</span>
                  <span className="text-white font-medium">{project ? new Date(project.finalDeadline).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-brand-border/40 pb-2">
                  <span className="text-brand-muted">Active Week:</span>
                  <span className="text-brand-gold font-bold">Week {currentWeek}</span>
                </div>
                {project?.instructions && (
                  <div className="pt-2 text-brand-muted text-[10px] flex gap-1.5 items-start">
                    <Info className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                    <span>{project.instructions}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit report Form */}
            <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Upload className="w-5 h-5 text-brand-gold" />
                <span>Submit Weekly Report</span>
              </h3>
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                    Select Week Number
                  </label>
                  <select
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(e.target.value)}
                    className="w-full text-sm bg-black border border-brand-border text-white px-3 py-2 rounded focus:outline-none focus:border-brand-gold"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Week {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                    Report File (PDF / DOCX / ZIP)
                  </label>
                  <input
                    id="report-file"
                    type="file"
                    required
                    accept=".pdf,.docx,.doc,.zip"
                    onChange={(e) => e.target.files && setFile(e.target.files[0])}
                    className="w-full text-zinc-400 text-xs file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-brand-gold file:cursor-pointer hover:file:bg-zinc-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 rounded bg-brand-gold hover:bg-brand-gold-hover text-black text-sm font-bold transition cursor-pointer btn-gold border-0 disabled:opacity-50"
                >
                  {submitting ? 'Uploading...' : 'Submit Report'}
                </button>
              </form>
            </div>

            {/* Submission History */}
            <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
              <h3 className="font-bold text-white text-base">Submission History</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {assignment.weeklySubmissions.map((sub) => (
                  <div key={sub.id} className="p-3 bg-black/40 border border-brand-border rounded-xl text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">Week {sub.weekNumber} Report</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                        sub.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : sub.status === 'CORRECTION_REQUESTED'
                          ? 'bg-amber-500/10 text-amber-400 border border-brand-gold/20'
                          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {sub.status}
                      </span>
                    </div>

                    <a
                      href={sub.fileUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand-gold hover:underline font-mono truncate block text-[10px]"
                    >
                      {sub.fileName}
                    </a>

                    {sub.mentorComment && (
                      <div className="bg-zinc-950 p-2 rounded border border-brand-border/40 text-[10px] text-zinc-300 italic flex items-start gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                        <span>Feedback: "{sub.mentorComment}"</span>
                      </div>
                    )}
                  </div>
                ))}
                {assignment.weeklySubmissions.length === 0 && (
                  <p className="text-zinc-500 text-xs italic text-center py-4">No reports submitted yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
