'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Download, RefreshCw, FileText, Globe, Upload, Clock, CheckCircle2, FileSpreadsheet } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  docUrl: string | null;
  docName: string | null;
  refUrl: string | null;
  refName: string | null;
  group: string;
  uploadedBy: string;
  createdAt: string;
}

interface WeeklySubmission {
  id: string;
  fileName: string;
  fileUrl: string;
  submissionTime: string;
}

export default function DomainProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [submissions, setSubmissions] = useState<WeeklySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/intern/problem-statements');
      if (!res.ok) throw new Error('Failed to load domain projects');
      const data = await res.json();
      setProjects(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/intern/submissions');
      if (!res.ok) throw new Error('Failed to load submission history');
      const data = await res.json();
      setSubmissions(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSubmissions();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      let fileUrl = '';
      let uploaded = false;

      try {
        // 1. Get Cloudinary signature from our local API
        const signRes = await fetch('/api/cloudinary/sign?folder=manchester-tech/weekly-submissions');
        if (!signRes.ok) throw new Error('Failed to generate upload signature');
        const signData = await signRes.json();
        const { signature, timestamp, folder, apiKey, cloudName } = signData;

        // 2. Determine Cloudinary resource type
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const resourceType = (ext === 'pdf' || ext === 'docx' || ext === 'doc' || ext === 'zip') ? 'raw' : 'auto';

        // 3. Upload file directly to Cloudinary
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
          console.warn('Cloudinary upload failed, attempting local upload...');
        }
      } catch (e) {
        console.warn('Cloudinary upload threw error, trying local upload:', e);
      }

      if (!uploaded) {
        const localFormData = new FormData();
        localFormData.append('file', file);
        const localRes = await fetch('/api/upload', {
          method: 'POST',
          body: localFormData,
        });
        if (!localRes.ok) {
          throw new Error('Both Cloudinary and Local file upload failed.');
        }
        const localResult = await localRes.json();
        fileUrl = localResult.secure_url;
      }

      // 4. Save submission metadata in our database
      const res = await fetch('/api/intern/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl,
          fileName: file.name,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register submission');

      setSuccess('Weekly submission uploaded successfully! Your mentor has been notified.');
      setFile(null);
      
      // Clear file input manually
      const fileInput = document.getElementById('project-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

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
        <h1 className="text-3xl font-bold text-gold-gradient">Domain Projects</h1>
        <p className="text-zinc-400 text-sm mt-1">Review assigned problem statements, reference documentation, and submit weekly deliverables</p>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-lg text-sm text-center">
          {success}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-gold" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT/MID COLUMN: Domain Project details */}
          <div className="lg:col-span-2 space-y-6">
            {projects.map((project) => (
              <div key={project.id} className="glass-panel p-6 rounded-2xl border border-brand-border space-y-6 bg-black/40">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-zinc-900 border border-brand-border rounded-xl text-brand-gold">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{project.title}</h3>
                    <p className="text-xs text-brand-muted mt-0.5">Assigned by Mentor {project.uploadedBy}</p>
                  </div>
                </div>

                {project.description && (
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase font-extrabold tracking-wider text-brand-gold">Project Description</h4>
                    <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">{project.description}</p>
                  </div>
                )}

                {/* Attachments & Files */}
                <div className="space-y-3">
                  <h4 className="text-xs uppercase font-extrabold tracking-wider text-brand-gold">Project Assets</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Problem Statement document */}
                    <div className="flex items-center justify-between bg-black/50 border border-brand-border/60 p-3.5 rounded-xl">
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="w-5 h-5 text-brand-gold shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-white truncate font-medium">Problem Statement</p>
                          <p className="text-[9px] text-brand-muted">Core specification file</p>
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

                    {/* Documentation guide */}
                    {project.docUrl && (
                      <div className="flex items-center justify-between bg-black/50 border border-brand-border/60 p-3.5 rounded-xl">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-white truncate font-medium">{project.docName || 'Guide.pdf'}</p>
                            <p className="text-[9px] text-brand-muted">Documentation Guide</p>
                          </div>
                        </div>
                        <a
                          href={project.docUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-zinc-950 hover:bg-zinc-900 border border-brand-border rounded text-emerald-400 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    )}

                    {/* Reference link */}
                    {project.refUrl && (
                      <div className="flex items-center justify-between bg-black/50 border border-brand-border/60 p-3.5 rounded-xl col-span-1 sm:col-span-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Globe className="w-5 h-5 text-sky-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs text-white truncate font-medium">{project.refName || 'Web Reference Link'}</p>
                            <p className="text-[9px] text-brand-muted">References & documentation link</p>
                          </div>
                        </div>
                        <a
                          href={project.refUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-zinc-950 hover:bg-zinc-900 border border-brand-border rounded text-sky-400 cursor-pointer flex items-center justify-center gap-1 text-[10px] font-semibold px-2.5"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Open Link</span>
                        </a>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            ))}
            
            {projects.length === 0 && (
              <div className="py-12 text-center text-brand-muted italic glass-panel rounded-2xl border border-brand-border bg-black/20">
                No domain projects uploaded for your group yet.
              </div>
            )}

            {/* SUBMISSION HISTORY */}
            <div className="glass-panel p-6 rounded-2xl border border-brand-border">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-brand-gold" />
                <span>Weekly Submission History</span>
              </h3>

              {loadingHistory ? (
                <div className="py-8 flex justify-center items-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-brand-gold" />
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="p-4 bg-zinc-900/40 border border-brand-border rounded-xl flex items-center justify-between gap-4 hover:border-brand-gold/10 transition">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20 shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate max-w-sm">{sub.fileName}</p>
                          <p className="text-[10px] text-brand-muted mt-0.5">
                            Submitted on {new Date(sub.submissionTime).toLocaleDateString()} at {new Date(sub.submissionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <a
                        href={sub.fileUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-zinc-950 border border-brand-border rounded-lg text-brand-gold hover:bg-zinc-900 transition cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                  {submissions.length === 0 && (
                    <div className="py-8 text-center text-brand-muted italic bg-black/25 rounded-xl border border-brand-border border-dashed">
                      No submissions uploaded yet
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Submit Project Deliverables */}
          <div className="glass-panel p-6 rounded-2xl border border-brand-border h-fit bg-black/25">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-brand-gold" />
              <span>Submit Project Deliverable</span>
            </h3>
            <p className="text-xs text-brand-muted mb-4">Upload weekly progress reports or final project builds (PDF, DOCX, ZIP)</p>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="border-2 border-dashed border-brand-border hover:border-brand-gold/40 rounded-xl p-8 text-center transition cursor-pointer relative bg-black/40 group">
                <input
                  id="project-file-input"
                  type="file"
                  accept=".pdf,.docx,.zip"
                  required
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <FileSpreadsheet className="w-10 h-10 text-brand-muted mx-auto mb-3 group-hover:text-brand-gold transition" />
                {file ? (
                  <div>
                    <p className="text-sm font-semibold text-white truncate max-w-xs mx-auto">{file.name}</p>
                    <p className="text-[10px] text-emerald-400 font-bold mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to submit
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-zinc-300">Drag & drop or click to choose</p>
                    <p className="text-[10px] text-brand-muted mt-1 uppercase font-semibold">PDF, DOCX, or ZIP files only</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || !file}
                className="w-full py-2.5 px-4 rounded-lg bg-brand-gold hover:bg-brand-gold-hover text-black text-sm font-bold transition duration-200 cursor-pointer btn-gold border-0 disabled:opacity-50"
              >
                {submitting ? 'Uploading report...' : 'Submit Deliverable'}
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
