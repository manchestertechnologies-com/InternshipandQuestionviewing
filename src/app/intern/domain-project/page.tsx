'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Download, 
  RefreshCw, 
  FileText, 
  Upload, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  Info,
  ChevronRight,
  Code2,
  ListTodo,
  CheckCircle,
  FileCheck
} from 'lucide-react';

interface Submission {
  id: string;
  fileName: string;
  fileUrl: string;
  submissionTime: string;
  weekNumber: number | null;
  status: string; // "PENDING", "APPROVED", "CORRECTION_REQUESTED"
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

// Custom Markdown Parser to avoid raw formatting characters
function parseMarkdown(text: string | null | undefined): React.ReactNode {
  if (!text) return <p className="text-zinc-500 italic text-sm">No details provided.</p>;

  const lines = text.split(/\r?\n/);
  let elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let listType: 'bullet' | 'number' | null = null;

  const flushList = (key: string | number) => {
    if (currentList.length > 0) {
      if (listType === 'bullet') {
        elements.push(<ul key={`ul-${key}`} className="list-disc pl-6 space-y-1.5 mb-4 text-zinc-300">{...currentList}</ul>);
      } else {
        elements.push(<ol key={`ol-${key}`} className="list-decimal pl-6 space-y-1.5 mb-4 text-zinc-300">{...currentList}</ol>);
      }
      currentList = [];
      listType = null;
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList(idx);
      elements.push(<div key={`br-${idx}`} className="h-3" />);
      return;
    }

    // Headers
    if (trimmed.startsWith('#')) {
      flushList(idx);
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const content = parseInlineMarkdown(match[2]);
        if (level === 1) elements.push(<h1 key={idx} className="text-xl font-bold text-white mt-6 mb-3 border-b border-brand-border/40 pb-2">{content}</h1>);
        else if (level === 2) elements.push(<h2 key={idx} className="text-lg font-bold text-white mt-5 mb-2.5">{content}</h2>);
        else elements.push(<h3 key={idx} className="text-base font-bold text-brand-gold mt-4 mb-2">{content}</h3>);
        return;
      }
    }

    // Bullet Lists (*, -, •)
    if (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•')) {
      if (listType !== 'bullet') {
        flushList(idx);
        listType = 'bullet';
      }
      const content = trimmed.substring(1).trim();
      currentList.push(<li key={`li-${idx}`}>{parseInlineMarkdown(content)}</li>);
      return;
    }

    // Numbered Lists (1.)
    if (/^\d+\.\s+/.test(trimmed)) {
      if (listType !== 'number') {
        flushList(idx);
        listType = 'number';
      }
      const match = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (match) {
        currentList.push(<li key={`li-${idx}`} value={parseInt(match[1], 10)}>{parseInlineMarkdown(match[2])}</li>);
        return;
      }
    }

    // Normal paragraph
    flushList(idx);
    elements.push(<p key={idx} className="text-zinc-300 text-sm mb-3.5 leading-relaxed">{parseInlineMarkdown(trimmed)}</p>);
  });

  flushList('end');
  return <div className="space-y-1">{elements}</div>;
}

function parseInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  while (remaining.length > 0) {
    // Bold **text**
    const boldMatch = remaining.match(/^([^*]*)\*\*([^*]+)\*\*(.*)$/);
    if (boldMatch) {
      if (boldMatch[1]) parts.push(boldMatch[1]);
      parts.push(<strong key={`b-${keyIdx++}`} className="font-bold text-white">{boldMatch[2]}</strong>);
      remaining = boldMatch[3];
      continue;
    }

    // Italic *text*
    const italicMatch = remaining.match(/^([^*]*)\*([^*]+)\*(.*)$/);
    if (italicMatch) {
      if (italicMatch[1]) parts.push(italicMatch[1]);
      parts.push(<em key={`i-${keyIdx++}`} className="italic text-zinc-100">{italicMatch[2]}</em>);
      remaining = italicMatch[3];
      continue;
    }

    parts.push(remaining);
    break;
  }

  return parts;
}

const getTotalWeeks = (durationStr: string | null | undefined): number => {
  if (!durationStr) return 8;
  const num = parseInt(durationStr, 10);
  if (isNaN(num)) return 8;
  if (durationStr.toLowerCase().includes('week')) return num;
  return Math.ceil(num / 7);
};

const parseWeeklyMilestonesText = (text: string | null | undefined, totalWeeks: number): string[] => {
  const milestones: string[] = Array(totalWeeks).fill("Milestone details not specified by mentor");
  if (!text) return milestones;

  const lines = text.split(/\r?\n/);
  let currentWeekNum = 0;
  let currentContent = "";

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const match = trimmed.match(/^[Ww]eek\s*(\d+)/);
    if (match) {
      if (currentWeekNum >= 1 && currentWeekNum <= totalWeeks) {
        milestones[currentWeekNum - 1] = currentContent.trim();
      }
      currentWeekNum = parseInt(match[1], 10);
      currentContent = trimmed.replace(/^[Ww]eek\s*\d+\s*[:\-]?\s*/, "");
    } else {
      if (currentWeekNum >= 1 && currentWeekNum <= totalWeeks) {
        currentContent += "\n" + trimmed;
      }
    }
  });

  if (currentWeekNum >= 1 && currentWeekNum <= totalWeeks) {
    milestones[currentWeekNum - 1] = currentContent.trim();
  }

  const hasParsedAny = milestones.some(m => m !== "Milestone details not specified by mentor");
  if (!hasParsedAny) {
    const paragraphs = lines.filter(l => l.trim().length > 0);
    for (let i = 0; i < Math.min(paragraphs.length, totalWeeks); i++) {
      milestones[i] = paragraphs[i];
    }
  }

  return milestones;
};

const getWeekStatus = (weekNum: number, submissions: Submission[], currentActiveWeek: number) => {
  const sub = submissions.find(s => s.weekNumber === weekNum);
  if (sub) {
    if (sub.status === 'APPROVED') return 'Completed';
    if (sub.status === 'CORRECTION_REQUESTED') return 'Correction Required';
    return 'Submitted'; // PENDING
  }
  if (weekNum === currentActiveWeek) return 'In Progress';
  if (weekNum < currentActiveWeek) return 'Not Started'; // past due without submission
  return 'Not Started';
};

const getWeekDeadline = (startDateStr: string, weekNum: number) => {
  const start = new Date(startDateStr);
  const deadlineDate = new Date(start.getTime() + weekNum * 7 * 24 * 60 * 60 * 1000);
  return deadlineDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export default function DomainProjectPage() {
  const [intern, setIntern] = useState<InternProfile | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redesign Navigation Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'technologies' | 'outcome' | 'milestones' | 'reports'>('overview');

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
      let fileUrl = '';
      let uploaded = false;

      let lastErrorMsg = '';
      // 1. Try Cloudinary direct client-side upload first
      try {
        const signRes = await fetch('/api/cloudinary/sign?folder=manchester-tech/weekly-submissions');
        if (!signRes.ok) {
          const errData = await signRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to generate upload signature');
        }
        const signData = await signRes.json();
        const { signature, timestamp, folder, apiKey, cloudName } = signData;

        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const resourceType = (ext === 'pdf' || ext === 'docx' || ext === 'doc' || ext === 'zip') ? 'raw' : 'auto';

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

        if (cloudinaryRes.ok) {
          const uploadResult = await cloudinaryRes.json();
          fileUrl = uploadResult.secure_url;
          uploaded = true;
        } else {
          const errResult = await cloudinaryRes.json().catch(() => ({}));
          lastErrorMsg = errResult.error?.message || 'Cloudinary responded with error';
          console.warn('Cloudinary upload direct failed, falling back to local:', lastErrorMsg);
        }
      } catch (e: any) {
        lastErrorMsg = e.message || String(e);
        console.warn('Cloudinary signature/upload failed, trying local upload route:', e);
      }

      // 2. Fallback to Local Upload if Cloudinary fails/disabled
      if (!uploaded) {
        const localFormData = new FormData();
        localFormData.append('file', file);
        const localRes = await fetch('/api/upload', {
          method: 'POST',
          body: localFormData,
        });
        if (!localRes.ok) {
          const errData = await localRes.json().catch(() => ({}));
          throw new Error(errData.error || `Upload failed: ${lastErrorMsg || 'Internal server error'}`);
        }
        const localResult = await localRes.json();
        fileUrl = localResult.secure_url;
      }

      // 3. Save submission metadata in DB
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

      setSuccess(`Week ${weekNumber} progress report submitted successfully!`);
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
      <div className="py-12 flex justify-center items-center h-[50vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-gold" />
      </div>
    );
  }

  const getCurrentWeek = (startDateStr: string) => {
    const start = new Date(startDateStr);
    const today = new Date();
    const diffTime = today.getTime() - start.getTime();
    if (diffTime < 0) return 1; // Project hasn't started yet
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.ceil(diffDays / 7);
    return Math.max(1, week);
  };

  const project = assignment?.project;
  const currentWeek = project ? getCurrentWeek(project.startDate) : 1;
  const totalWeeks = project ? getTotalWeeks(project.duration) : 8;

  // Render content according to active tabs
  const renderTabContent = () => {
    if (!project) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
              <h3 className="text-xs uppercase font-bold tracking-wider text-brand-gold border-b border-brand-border/40 pb-2">
                Problem Statement
              </h3>
              <div className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
                {parseMarkdown(project.problemStatement)}
              </div>
            </div>

            {project.description && (
              <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-wider text-brand-muted border-b border-brand-border/40 pb-2">
                  Details / Scope
                </h3>
                <div className="text-zinc-400 text-sm whitespace-pre-wrap leading-relaxed">
                  {parseMarkdown(project.description)}
                </div>
              </div>
            )}

            {project.instructions && (
              <div className="glass-panel p-6 rounded-2xl border border-brand-border flex gap-3 items-start">
                <Info className="w-5 h-5 text-brand-gold shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Special Instructions</h4>
                  <p className="text-xs text-brand-muted leading-relaxed">{project.instructions}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 'technologies':
        return (
          <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
            <h3 className="text-xs uppercase font-bold tracking-wider text-brand-gold border-b border-brand-border/40 pb-2 flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              <span>Technologies & Tools</span>
            </h3>
            <div className="bg-zinc-950/60 p-4 rounded-xl border border-brand-border">
              {parseMarkdown(project.technologies)}
            </div>
          </div>
        );

      case 'outcome':
        return (
          <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
            <h3 className="text-xs uppercase font-bold tracking-wider text-brand-gold border-b border-brand-border/40 pb-2 flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              <span>Expected Outcome</span>
            </h3>
            <div className="bg-zinc-950/60 p-4 rounded-xl border border-brand-border">
              {parseMarkdown(project.expectedOutcome)}
            </div>
          </div>
        );

      case 'milestones':
        const milestones = parseWeeklyMilestonesText(project.weeklyMilestones, totalWeeks);
        return (
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-2">
              <h3 className="text-xs uppercase font-bold tracking-wider text-brand-gold border-b border-brand-border/40 pb-2 flex items-center gap-2">
                <ListTodo className="w-4 h-4" />
                <span>Project Milestones Checklist</span>
              </h3>
              <p className="text-xs text-brand-muted">Track progress weekly based on duration. Milestones update based on your report submissions.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: totalWeeks }).map((_, index) => {
                const weekNum = index + 1;
                const status = getWeekStatus(weekNum, assignment?.weeklySubmissions || [], currentWeek);
                const deadline = getWeekDeadline(project.startDate, weekNum);
                
                // Styling badges dynamically
                let badgeClass = 'bg-zinc-800 text-zinc-400 border border-zinc-700';
                if (status === 'Completed') {
                  badgeClass = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                } else if (status === 'Correction Required') {
                  badgeClass = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                } else if (status === 'Submitted') {
                  badgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                } else if (status === 'In Progress') {
                  badgeClass = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                }

                return (
                  <div 
                    key={weekNum} 
                    className={`glass-panel p-5 rounded-2xl border flex flex-col justify-between hover:border-brand-gold/30 transition duration-300 relative overflow-hidden group ${
                      status === 'In Progress' ? 'border-brand-gold/40' : 'border-brand-border'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-bold text-white bg-white/5 border border-brand-border px-2.5 py-0.5 rounded-md">
                          Week {weekNum}
                        </span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${badgeClass}`}>
                          {status}
                        </span>
                      </div>
                      
                      <div className="text-zinc-300 text-xs leading-relaxed min-h-[50px] whitespace-pre-wrap">
                        {milestones[index]}
                      </div>
                    </div>

                    <div className="border-t border-brand-border/40 mt-4 pt-3 flex justify-between items-center text-[10px]">
                      <span className="text-brand-muted">Target Deadline:</span>
                      <span className="text-white font-mono font-medium">{deadline}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Submit Report Form */}
            <div className="xl:col-span-1 glass-panel p-6 rounded-2xl border border-brand-border space-y-4 h-fit">
              <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-brand-border/40 pb-2">
                <Upload className="w-5 h-5 text-brand-gold" />
                <span>Submit Weekly Report</span>
              </h3>
              
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold text-brand-muted uppercase tracking-wider mb-2">
                    Select Week Number
                  </label>
                  <select
                    value={weekNumber}
                    onChange={(e) => setWeekNumber(e.target.value)}
                    className="w-full text-sm bg-black border border-brand-border text-white px-3 py-2.5 rounded-lg focus:outline-none focus:border-brand-gold"
                  >
                    {Array.from({ length: totalWeeks }).map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Week {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-brand-muted uppercase tracking-wider mb-2">
                    Upload File (PDF, DOCX, ZIP)
                  </label>
                  <input
                    id="report-file"
                    type="file"
                    required
                    accept=".pdf,.docx,.doc,.zip"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const selectedFile = e.target.files[0];
                        if (selectedFile.size > 10 * 1024 * 1024) {
                          setError('File is too large (above 10MB). Cloudinary Free plan limits uploads to 10MB. Please compress your file or choose a smaller one.');
                          setFile(null);
                          e.target.value = '';
                          return;
                        }
                        setFile(selectedFile);
                        setError('');
                      }
                    }}
                    className="w-full text-zinc-400 text-xs file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-brand-gold file:cursor-pointer hover:file:bg-zinc-800"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !file}
                  className="w-full py-2.5 px-4 rounded-lg bg-brand-gold hover:bg-brand-gold-hover text-black text-sm font-bold transition cursor-pointer btn-gold border-0 disabled:opacity-50"
                >
                  {submitting ? 'Uploading Report...' : 'Submit Report'}
                </button>
              </form>
            </div>

            {/* Submission History */}
            <div className="xl:col-span-2 glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
              <h3 className="font-bold text-white text-base border-b border-brand-border/40 pb-2">
                Submission History
              </h3>
              
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {assignment.weeklySubmissions.map((sub) => (
                  <div key={sub.id} className="p-4 bg-black/40 border border-brand-border rounded-xl text-xs space-y-3 hover:border-brand-gold/10 transition">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-white text-sm">Week {sub.weekNumber} Report</span>
                        <p className="text-[10px] text-brand-muted mt-0.5">
                          Submitted on {new Date(sub.submissionTime).toLocaleDateString()} at {new Date(sub.submissionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide border ${
                        sub.status === 'APPROVED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : sub.status === 'CORRECTION_REQUESTED'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        {sub.status === 'APPROVED' ? 'Approved' : sub.status === 'CORRECTION_REQUESTED' ? 'Correction Req.' : 'Submitted'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-lg border border-brand-border/30">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-brand-gold shrink-0" />
                        <span className="text-zinc-300 font-mono truncate text-[10px]">{sub.fileName}</span>
                      </div>
                      <a
                        href={sub.fileUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-gold hover:text-white transition font-bold shrink-0 text-[10px] flex items-center gap-1 hover:underline ml-2"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    </div>

                    {sub.mentorComment && (
                      <div className="bg-zinc-900/60 p-3 rounded-lg border border-brand-border/30 text-[11px] text-zinc-300 italic flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-white not-italic block mb-0.5">Mentor Feedback:</span>
                          <span>"{sub.mentorComment}"</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {assignment.weeklySubmissions.length === 0 && (
                  <div className="text-center py-12 space-y-2">
                    <FileText className="w-10 h-10 text-zinc-700 mx-auto" />
                    <p className="text-zinc-500 text-xs italic">No weekly report submissions recorded yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 max-w-full">
      <div>
        <h1 className="text-3xl font-bold text-gold-gradient">Domain Project</h1>
        <p className="text-zinc-400 text-sm mt-1">Manage, view milestones, and submit weekly progress deliverables for your assigned project</p>
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
        <div className="py-16 text-center text-brand-muted italic glass-panel rounded-3xl border border-brand-border space-y-4">
          <BookOpen className="w-16 h-16 text-zinc-700 mx-auto animate-pulse" />
          <p className="text-lg font-semibold text-white">No Assigned Domain Project</p>
          <p className="text-xs text-zinc-500 max-w-md mx-auto">
            You do not currently have a domain-based project assigned. Assignments are configured by your mentor based on your domain ({intern?.domain || 'N/A'}) and duration ({intern?.duration || 'N/A'}).
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Project Header and Timeline Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left: Project Header Card */}
            <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-brand-border flex flex-col justify-between hover:border-brand-gold/10 transition duration-300">
              <div className="space-y-4">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <span className="text-[10px] bg-brand-gold/10 border border-brand-gold/20 text-brand-gold px-3 py-1 rounded-md font-bold uppercase tracking-wider">
                    {project?.domain} Domain
                  </span>
                  <span className="text-[10px] bg-white/5 border border-brand-border text-brand-muted px-3 py-1 rounded-md font-bold uppercase tracking-wider">
                    Duration: {project?.duration}
                  </span>
                </div>

                <h2 className="text-2xl font-extrabold text-white leading-tight">{project?.title}</h2>
                
                <div className="text-xs text-brand-muted">
                  Assigned Mentor: <strong className="text-white font-medium">{project?.mentor?.name || 'Mentor'}</strong>
                </div>
              </div>

              {project?.fileUrl && (
                <div className="flex items-center justify-between bg-black/40 border border-brand-border/60 p-3 rounded-xl max-w-md mt-6">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-brand-gold shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-white truncate font-mono">{project.fileName || 'Project_Guidelines'}</p>
                      <p className="text-[9px] text-brand-muted">Download Guidelines</p>
                    </div>
                  </div>
                  <a
                    href={project.fileUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-zinc-950 hover:bg-zinc-900 border border-brand-border rounded-lg text-brand-gold cursor-pointer ml-4 transition"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Right: Timeline & Progress Card */}
            <div className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col justify-between hover:border-brand-gold/10 transition duration-300">
              <h3 className="font-bold text-white text-base border-b border-brand-border/40 pb-2 uppercase tracking-wide text-xs">
                Timeline & Progress
              </h3>
              
              <div className="space-y-3 text-xs py-2">
                <div className="flex justify-between border-b border-brand-border/30 pb-2">
                  <span className="text-brand-muted">Start Date:</span>
                  <span className="text-white font-medium">{project ? new Date(project.startDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                </div>
                <div className="flex justify-between border-b border-brand-border/30 pb-2">
                  <span className="text-brand-muted">Final Deadline:</span>
                  <span className="text-brand-gold font-bold">{project ? new Date(project.finalDeadline).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-muted">Current Status:</span>
                  <span className="text-brand-gold font-bold">Week {currentWeek} of {totalWeeks}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 pt-2 border-t border-brand-border/30">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-brand-muted uppercase">Milestones Completed</span>
                  <span className="text-white">{assignment.progress}%</span>
                </div>
                <div className="w-full bg-zinc-900 border border-brand-border/40 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-brand-gold h-2 rounded-full transition-all duration-500"
                    style={{ width: `${assignment.progress}%` }}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Tabbed Navigation Bar */}
          <div className="flex border-b border-brand-border/80 overflow-x-auto shrink-0 scrollbar-none">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'technologies', label: 'Technologies & Tools' },
              { id: 'outcome', label: 'Expected Outcome' },
              { id: 'milestones', label: 'Weekly Milestones' },
              { id: 'reports', label: 'Weekly Reports' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-6 text-sm font-semibold transition border-b-2 cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-brand-gold text-brand-gold font-bold' 
                    : 'border-transparent text-brand-text hover:text-white hover:border-brand-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Pages */}
          <div className="w-full">
            {renderTabContent()}
          </div>

        </div>
      )}
    </div>
  );
}
