'use client';

import React, { useState, useEffect } from 'react';
import { ClipboardList, Users, Clock, FileText, CheckCircle, Plus, RefreshCw, X, Download } from 'lucide-react';

interface Intern {
  id: string;
  name: string;
  rollNo: number;
}

interface TaskAssignment {
  id: string;
  status: string;
  completedAt: string | null;
  intern: {
    name: string;
    rollNo: number;
  };
}

interface Task {
  id: string;
  title: string;
  description: string;
  fileUrl: string | null;
  fileName: string | null;
  deadlineDays: number;
  createdAt: string;
  assignments: TaskAssignment[];
}

export default function TaskAssignmentPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cutoffHour, setCutoffHour] = useState('23'); // '23' (11:59:59 PM), '22', '20', '18', '17'
  const [assignScope, setAssignScope] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [selectedInterns, setSelectedInterns] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, internsRes] = await Promise.all([
        fetch('/api/mentor/tasks'),
        fetch('/api/mentor/interns'),
      ]);

      if (!tasksRes.ok || !internsRes.ok) {
        throw new Error('Failed to load tasks/interns');
      }

      const tasksData = await tasksRes.json();
      const internsData = await internsRes.json();

      setTasks(tasksData);
      setInterns(internsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCheckboxChange = (internId: string) => {
    setSelectedInterns((prev) =>
      prev.includes(internId)
        ? prev.filter((id) => id !== internId)
        : [...prev, internId]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      for (const f of selectedFiles) {
        if (f.size > 10 * 1024 * 1024) {
          setError(`File "${f.name}" is too large (above 10MB). Cloudinary Free plan limits uploads to 10MB. Please choose smaller files.`);
          setFiles([]);
          e.target.value = '';
          return;
        }
      }
      setFiles(selectedFiles);
      setError('');
    }
  };

  const uploadFileDirect = async (targetFile: File, folderName: string): Promise<string> => {
    const localFormData = new FormData();
    localFormData.append('file', targetFile);
    const localRes = await fetch('/api/upload', {
      method: 'POST',
      body: localFormData,
    });
    if (!localRes.ok) {
      const errData = await localRes.json().catch(() => ({}));
      throw new Error(errData.error || 'Upload failed: Internal server error');
    }
    const localResult = await localRes.json();
    return localResult.secure_url || localResult.url;
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (!title.trim()) throw new Error('Title is required');
      if (!description.trim()) throw new Error('Description is required');

      let fileUrl: string | null = null;
      let fileName: string | null = null;

      // 1. Upload files (PDF, DOCX, etc.) concurrently / sequentially with helper
      if (files.length > 0) {
        setUploadingFile(true);
        try {
          const uploadedList = [];
          for (const currentFile of files) {
            const uploadedUrl = await uploadFileDirect(currentFile, 'manchester-tech/tasks');
            uploadedList.push({ url: uploadedUrl, name: currentFile.name });
          }

          fileUrl = JSON.stringify(uploadedList);
          fileName = uploadedList.map(f => f.name).join(', ');
        } finally {
          setUploadingFile(false);
        }
      }

      // 2. Submit task payload as JSON
      const assigneeIds = assignScope === 'ALL' ? 'ALL' : selectedInterns.join(',');
      if (assignScope === 'SPECIFIC' && selectedInterns.length === 0) {
        throw new Error('Please select at least one intern');
      }

      const res = await fetch('/api/mentor/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          deadlineDays: parseInt(cutoffHour, 10),
          assigneeIds,
          fileUrl,
          fileName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create task');

      setSuccess('Task assigned successfully!');
      setTitle('');
      setDescription('');
      setCutoffHour('23');
      setAssignScope('ALL');
      setSelectedInterns([]);
      setFiles([]);
      setShowModal(false);
      fetchData();
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
          <h1 className="text-3xl font-bold text-gold-gradient">Assign Daily Tasks</h1>
          <p className="text-zinc-400 text-sm mt-1">Upload worksheets (DOCX/PDF) and assign them to your group</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 py-2.5 px-5 bg-brand-gold text-black hover:bg-brand-gold-hover font-semibold rounded-lg shadow-lg shadow-brand-gold/15 transition duration-200 cursor-pointer btn-gold shrink-0 border-0"
        >
          <Plus className="w-5 h-5" />
          <span>Create & Assign Task</span>
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
          {tasks.map((task) => (
            <div key={task.id} className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{task.title}</h3>
                  <p className="text-xs text-brand-muted mt-1">
                    Assigned on {new Date(task.createdAt).toLocaleDateString()} at {new Date(task.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-brand-gold font-semibold uppercase tracking-wider bg-brand-gold/10 border border-brand-gold/20 px-3 py-1 rounded-full shrink-0">
                  <Clock className="w-4 h-4" />
                  <span>Due Today at {task.deadlineDays === 23 ? '23:59:59' : `${task.deadlineDays}:00:00`}</span>
                </div>
              </div>

              <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
                {task.description}
              </p>

              {task.fileUrl && (
                <div className="flex items-center gap-2 bg-black/40 border border-brand-border p-3 rounded-xl max-w-sm">
                  <FileText className="w-5 h-5 text-brand-gold shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate font-medium">{task.fileName || 'worksheets.docx'}</p>
                    <p className="text-[10px] text-brand-muted">Uploaded Attachment</p>
                  </div>
                  <a
                    href={task.fileUrl}
                    download
                    className="p-1.5 bg-zinc-950 hover:bg-zinc-900 border border-brand-border rounded text-brand-gold cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Assignees & Status */}
              <div className="border-t border-brand-border pt-4">
                <p className="text-xs uppercase font-bold tracking-wider text-brand-gold mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>Assigned Interns ({task.assignments.length})</span>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {task.assignments.map((asg) => (
                    <div key={asg.id} className="p-3 bg-black/30 border border-brand-border rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-white truncate max-w-[120px]">{asg.intern.name}</p>
                        <p className="text-[10px] text-brand-muted">Roll {asg.intern.rollNo}</p>
                      </div>
                      {asg.status === 'COMPLETED' ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <CheckCircle className="w-4 h-4" /> Completed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-brand-muted">
                          <Clock className="w-4 h-4" /> Pending
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="py-12 text-center text-brand-muted italic glass-panel rounded-2xl border border-brand-border">
              No tasks assigned yet. Click the button to assign one.
            </div>
          )}
        </div>
      )}

      {/* Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-brand-border overflow-hidden shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-brand-border flex justify-between items-center bg-black/40 shrink-0">
              <div className="flex items-center gap-2 text-brand-gold">
                <ClipboardList className="w-5 h-5" />
                <h2 className="font-bold text-lg text-white">Create & Assign Daily Task</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-white transition cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                  placeholder="e.g. Day 1 Worksheet - Calculus Limits"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Task Description / Instructions
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                  placeholder="Describe task expectations, required formats..."
                />
              </div>

              {/* File Attachment */}
              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Attach Worksheet (DOCX/PDF preferred)
                </label>
                <input
                  type="file"
                  multiple
                  accept=".docx,.pdf"
                  onChange={handleFileChange}
                  className="w-full text-zinc-400 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-brand-gold file:cursor-pointer hover:file:bg-zinc-800"
                />
              </div>

              {/* Same-day Deadline Cutoff Selection */}
              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Deadline Cutoff (Today Only)
                </label>
                <select
                  value={cutoffHour}
                  onChange={(e) => setCutoffHour(e.target.value)}
                  className="w-full text-sm bg-black border border-brand-border text-white px-3 py-2.5 rounded-lg focus:outline-none focus:border-brand-gold"
                >
                  <option value="23">23:59:59 (End of Day - Default)</option>
                  <option value="22">22:00:00 (10:00 PM)</option>
                  <option value="20">20:00:00 (8:00 PM)</option>
                  <option value="18">18:00:00 (6:00 PM)</option>
                  <option value="17">17:00:00 (5:00 PM)</option>
                </select>
              </div>

              {/* Assignees */}
              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Assign To
                </label>
                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="assignScope"
                      checked={assignScope === 'ALL'}
                      onChange={() => setAssignScope('ALL')}
                      className="accent-brand-gold"
                    />
                    <span>Entire Group</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="assignScope"
                      checked={assignScope === 'SPECIFIC'}
                      onChange={() => setAssignScope('SPECIFIC')}
                      className="accent-brand-gold"
                    />
                    <span>Select Individuals</span>
                  </label>
                </div>

                {assignScope === 'SPECIFIC' && (
                  <div className="p-3 bg-black/60 border border-brand-border rounded-xl max-h-48 overflow-y-auto space-y-2">
                    {interns.map((intern) => (
                      <label key={intern.id} className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer hover:text-white transition">
                        <input
                          type="checkbox"
                          checked={selectedInterns.includes(intern.id)}
                          onChange={() => handleCheckboxChange(intern.id)}
                          className="accent-brand-gold"
                        />
                        <span>{intern.name} (Roll #{intern.rollNo})</span>
                      </label>
                    ))}
                    {interns.length === 0 && (
                      <p className="text-zinc-500 text-xs italic">No interns in your group</p>
                    )}
                  </div>
                )}
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
                  {submitting ? (uploadingFile ? 'Uploading Worksheet...' : 'Assigning Task...') : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
