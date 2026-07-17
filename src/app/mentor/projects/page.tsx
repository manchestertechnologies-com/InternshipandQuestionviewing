'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, RefreshCw, X, Download, FileText, Upload, Globe } from 'lucide-react';

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

export default function MentorProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [refUrl, setRefUrl] = useState('');
  const [refName, setRefName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mentor/projects');
      if (!res.ok) throw new Error('Failed to load domain projects');
      const data = await res.json();
      setProjects(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const uploadFileDirect = async (targetFile: File, folderName: string): Promise<string> => {
    // 1. Get Cloudinary signature
    const signRes = await fetch(`/api/cloudinary/sign?folder=${encodeURIComponent(folderName)}`);
    if (!signRes.ok) throw new Error('Failed to generate upload signature');
    const signData = await signRes.json();
    const { signature, timestamp, folder, apiKey, cloudName } = signData;

    // 2. Determine Cloudinary resource type
    const ext = targetFile.name.split('.').pop()?.toLowerCase() || '';
    const resourceType = (ext === 'pdf' || ext === 'docx' || ext === 'doc' || ext === 'zip') ? 'raw' : 'auto';

    // 3. Upload to Cloudinary
    const cloudinaryData = new FormData();
    cloudinaryData.append('file', targetFile);
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
    return uploadResult.secure_url;
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (!title.trim()) throw new Error('Title is required');
      if (!file) throw new Error('Problem Statement document is required');

      // Upload primary problem statement document
      const fileUrl = await uploadFileDirect(file, 'manchester-tech/projects');

      // Upload optional documentation file
      let uploadedDocUrl: string | null = null;
      let docFilename: string | null = null;
      if (docFile) {
        uploadedDocUrl = await uploadFileDirect(docFile, 'manchester-tech/projects/docs');
        docFilename = docFile.name;
      }

      // Save metadata in database
      const res = await fetch('/api/mentor/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          fileUrl,
          docUrl: uploadedDocUrl,
          docName: docFilename,
          refUrl: refUrl.trim() || null,
          refName: refName.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save project');

      setSuccess('Domain Project created and assigned successfully!');
      setTitle('');
      setDescription('');
      setFile(null);
      setDocFile(null);
      setRefUrl('');
      setRefName('');
      setShowModal(false);
      fetchProjects();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gold-gradient">Domain Projects</h1>
          <p className="text-zinc-400 text-sm mt-1">Upload and manage major projects, guidelines, and document references for your group</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 py-2.5 px-5 bg-brand-gold text-black hover:bg-brand-gold-hover font-semibold rounded-lg shadow-lg shadow-brand-gold/15 transition duration-200 cursor-pointer btn-gold shrink-0 border-0"
        >
          <Plus className="w-5 h-5" />
          <span>Upload Domain Project</span>
        </button>
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
        <div className="space-y-6">
          {projects.map((project) => (
            <div key={project.id} className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4 hover:border-brand-gold/10 transition">
              <div>
                <span className="text-[10px] bg-brand-gold/10 border border-brand-gold/20 text-brand-gold px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  {project.group}
                </span>
                <h3 className="text-xl font-bold text-white mt-2">{project.title}</h3>
                <p className="text-xs text-brand-muted mt-1">
                  Uploaded by {project.uploadedBy} on {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>

              {project.description && (
                <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
                  {project.description}
                </p>
              )}

              {/* Attachments Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center justify-between bg-black/40 border border-brand-border p-3 rounded-xl">
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen className="w-5 h-5 text-brand-gold shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-white truncate font-medium">Problem Statement</p>
                      <p className="text-[9px] text-brand-muted">Project core document</p>
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

                {project.docUrl && (
                  <div className="flex items-center justify-between bg-black/40 border border-brand-border p-3 rounded-xl">
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

                {project.refUrl && (
                  <div className="flex items-center justify-between bg-black/40 border border-brand-border p-3 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe className="w-5 h-5 text-sky-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-white truncate font-medium">{project.refName || 'Reference'}</p>
                        <p className="text-[9px] text-brand-muted">Web Link / Reference doc</p>
                      </div>
                    </div>
                    <a
                      href={project.refUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-zinc-950 hover:bg-zinc-900 border border-brand-border rounded text-sky-400 cursor-pointer"
                    >
                      <Globe className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="py-12 text-center text-brand-muted italic glass-panel rounded-2xl border border-brand-border">
              No domain projects uploaded yet. Click "Upload Domain Project" to add one.
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-brand-border overflow-hidden shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-brand-border flex justify-between items-center bg-black/40 shrink-0">
              <div className="flex items-center gap-2 text-brand-gold">
                <BookOpen className="w-5 h-5" />
                <h2 className="font-bold text-lg text-white">Upload Domain Project</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-white transition cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                  placeholder="e.g. Major Project - Chatbot Integration"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Project Description / Specifications
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                  placeholder="Explain goals, key deliverables, technologies required..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Problem Statement Document (PDF/DOCX/ZIP) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.docx,.doc,.zip"
                  onChange={(e) => e.target.files && setFile(e.target.files[0])}
                  className="w-full text-zinc-400 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-brand-gold file:cursor-pointer hover:file:bg-zinc-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Documentation Guide (Optional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.zip"
                  onChange={(e) => e.target.files && setDocFile(e.target.files[0])}
                  className="w-full text-zinc-400 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-brand-gold file:cursor-pointer hover:file:bg-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                    Reference Web Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={refUrl}
                    onChange={(e) => setRefUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                    Reference Link Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={refName}
                    onChange={(e) => setRefName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                    placeholder="e.g. API Reference Docs"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-zinc-900 border border-brand-border hover:bg-zinc-800 text-zinc-300 text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-brand-gold hover:bg-brand-gold-hover text-black text-sm font-bold transition cursor-pointer btn-gold border-0"
                >
                  {submitting ? 'Uploading Project...' : 'Upload & Assign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
