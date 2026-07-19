'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, RefreshCw, X, Download, FileText, Upload, Globe, Users, CheckSquare, Square } from 'lucide-react';

interface Intern {
  id: string;
  name: string;
  rollNo: number;
  domain: string;
  duration: string;
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
  createdAt: string;
  assignments: {
    id: string;
    intern: {
      name: string;
      rollNo: number;
    };
  }[];
}

export default function MentorProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [projectDomain, setProjectDomain] = useState('Web Development');
  const [durationFilter, setDurationFilter] = useState('All');
  const [problemStatement, setProblemStatement] = useState('');
  const [description, setDescription] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [duration, setDuration] = useState('60 Days');
  const [startDate, setStartDate] = useState('');
  const [finalDeadline, setFinalDeadline] = useState('');
  const [weeklyMilestones, setWeeklyMilestones] = useState('');
  const [instructions, setInstructions] = useState('');
  
  const [file, setFile] = useState<File | null>(null);
  const [selectedInterns, setSelectedInterns] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, internsRes] = await Promise.all([
        fetch('/api/mentor/projects'),
        fetch('/api/mentor/interns'),
      ]);

      if (!projectsRes.ok || !internsRes.ok) throw new Error('Failed to load data');
      
      const projectsData = await projectsRes.json();
      const internsData = await internsRes.json();
      
      setProjects(projectsData);
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

  // Filter interns based on target domain and duration
  const matchingInterns = interns.filter((intern) => {
    const matchDomain = intern.domain?.toLowerCase() === projectDomain.toLowerCase();
    const matchDuration = durationFilter === 'All' || intern.duration?.toLowerCase() === durationFilter.toLowerCase();
    return matchDomain && matchDuration;
  });

  // Automatically select all matching interns when filter or matching interns change
  useEffect(() => {
    setSelectedInterns(matchingInterns.map((i) => i.id));
  }, [projectDomain, durationFilter, interns]);

  // Automatically calculate finalDeadline
  useEffect(() => {
    if (!startDate) return;
    const date = new Date(startDate);
    if (isNaN(date.getTime())) return;

    const days = parseInt(duration, 10);
    if (isNaN(days)) return;

    const deadlineDate = new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
    const yyyy = deadlineDate.getFullYear();
    const mm = String(deadlineDate.getMonth() + 1).padStart(2, '0');
    const dd = String(deadlineDate.getDate()).padStart(2, '0');
    setFinalDeadline(`${yyyy}-${mm}-${dd}`);
  }, [startDate, duration]);

  const handleCheckboxChange = (internId: string) => {
    setSelectedInterns((prev) =>
      prev.includes(internId)
        ? prev.filter((id) => id !== internId)
        : [...prev, internId]
    );
  };

  const handleSelectAll = () => {
    const allIds = matchingInterns.map((i) => i.id);
    if (selectedInterns.length === allIds.length) {
      setSelectedInterns([]);
    } else {
      setSelectedInterns(allIds);
    }
  };

  const uploadFileDirect = async (targetFile: File, folderName: string): Promise<string> => {
    let lastErrorMsg = '';
    try {
      const signRes = await fetch(`/api/cloudinary/sign?folder=${encodeURIComponent(folderName)}`);
      if (!signRes.ok) {
        const errData = await signRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to generate upload signature');
      }
      const signData = await signRes.json();
      const { signature, timestamp, folder, apiKey, cloudName } = signData;

      const ext = targetFile.name.split('.').pop()?.toLowerCase() || '';
      const resourceType = (ext === 'pdf' || ext === 'docx' || ext === 'doc' || ext === 'zip') ? 'raw' : 'auto';

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

      if (cloudinaryRes.ok) {
        const uploadResult = await cloudinaryRes.json();
        return uploadResult.secure_url;
      } else {
        const errResult = await cloudinaryRes.json().catch(() => ({}));
        lastErrorMsg = errResult.error?.message || 'Cloudinary responded with error';
        console.warn('Cloudinary upload direct failed, trying local upload:', lastErrorMsg);
      }
    } catch (e: any) {
      lastErrorMsg = e.message || String(e);
      console.warn('Cloudinary upload direct threw error, trying local upload:', e);
    }

    // Local upload fallback
    const localFormData = new FormData();
    localFormData.append('file', targetFile);
    const localRes = await fetch('/api/upload', {
      method: 'POST',
      body: localFormData,
    });
    if (!localRes.ok) {
      const errData = await localRes.json().catch(() => ({}));
      throw new Error(errData.error || `Upload failed: ${lastErrorMsg || 'Internal server error'}`);
    }
    const localResult = await localRes.json();
    return localResult.secure_url;
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (selectedInterns.length === 0) {
      setError('Please select at least one intern to assign the project to.');
      return;
    }

    setSubmitting(true);

    try {
      if (!title.trim()) throw new Error('Project Title is required');
      if (!problemStatement.trim()) throw new Error('Problem Statement is required');

      let fileUrl: string | null = null;
      let fileName: string | null = null;
      if (file) {
        fileUrl = await uploadFileDirect(file, 'manchester-tech/projects');
        fileName = file.name;
      }

      const res = await fetch('/api/mentor/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          domain: projectDomain,
          problemStatement: problemStatement.trim(),
          description: description.trim(),
          technologies: technologies.trim(),
          expectedOutcome: expectedOutcome.trim(),
          duration,
          startDate,
          finalDeadline,
          weeklyMilestones: weeklyMilestones.trim(),
          instructions: instructions.trim(),
          fileUrl,
          fileName,
          internIds: selectedInterns,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save project');

      setSuccess('Domain Project created and assigned successfully!');
      setTitle('');
      setProblemStatement('');
      setDescription('');
      setTechnologies('');
      setExpectedOutcome('');
      setWeeklyMilestones('');
      setInstructions('');
      setFile(null);
      setSelectedInterns([]);
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
          <h1 className="text-3xl font-bold text-gold-gradient">Domain Projects</h1>
          <p className="text-zinc-400 text-sm mt-1">Design major projects and assign them to interns based on their domain and duration</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 py-2.5 px-5 bg-brand-gold text-black hover:bg-brand-gold-hover font-semibold rounded-lg shadow-lg shadow-brand-gold/15 transition duration-200 cursor-pointer btn-gold shrink-0 border-0"
        >
          <Plus className="w-5 h-5" />
          <span>Assign New Project</span>
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
              <div className="flex flex-wrap justify-between items-start gap-2">
                <div>
                  <div className="flex gap-2">
                    <span className="text-[10px] bg-brand-gold/10 border border-brand-gold/20 text-brand-gold px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      {project.domain}
                    </span>
                    <span className="text-[10px] bg-white/5 border border-brand-border text-brand-muted px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                      {project.duration}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-2">{project.title}</h3>
                  <p className="text-xs text-brand-muted mt-1">
                    Assigned on {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-xs text-zinc-400 bg-black/40 px-3 py-1.5 rounded-lg border border-brand-border">
                  Deadline: <strong>{new Date(project.finalDeadline).toLocaleDateString()}</strong>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase font-bold tracking-wider text-brand-gold">Problem Statement</p>
                <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
                  {project.problemStatement}
                </p>
              </div>

              {project.description && (
                <div className="space-y-2">
                  <p className="text-xs uppercase font-bold tracking-wider text-brand-muted">Detailed Description</p>
                  <p className="text-zinc-400 text-sm whitespace-pre-wrap leading-relaxed">
                    {project.description}
                  </p>
                </div>
              )}

              {project.technologies && (
                <div className="text-xs text-brand-muted bg-zinc-950 p-3 rounded-lg border border-brand-border">
                  Technologies / Tools: <strong className="text-white">{project.technologies}</strong>
                </div>
              )}

              {project.fileUrl && (
                <div className="flex items-center justify-between bg-black/40 border border-brand-border p-3 rounded-xl max-w-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-5 h-5 text-brand-gold shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-white truncate font-medium">{project.fileName || 'Attachment'}</p>
                      <p className="text-[9px] text-brand-muted">Project Document</p>
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

              {/* Assignments List */}
              <div className="border-t border-brand-border pt-4">
                <p className="text-xs uppercase font-bold tracking-wider text-brand-gold mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>Assigned Interns ({project.assignments.length})</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.assignments.map((asg) => (
                    <span key={asg.id} className="text-xs bg-black/30 border border-brand-border px-2.5 py-1 rounded-full text-zinc-300">
                      {asg.intern.name} (Roll #{asg.intern.rollNo})
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="py-12 text-center text-brand-muted italic glass-panel rounded-2xl border border-brand-border">
              No domain projects assigned yet. Click "Assign New Project" to add one.
            </div>
          )}
        </div>
      )}

      {/* Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl rounded-2xl border border-brand-border overflow-hidden shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[95vh]">
            <div className="p-6 border-b border-brand-border flex justify-between items-center bg-black/40 shrink-0">
              <div className="flex items-center gap-2 text-brand-gold">
                <BookOpen className="w-5 h-5" />
                <h2 className="font-bold text-lg text-white">Assign Domain Project</h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-500 hover:text-white transition cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="e.g. Building a Secure REST API"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                    Domain *
                  </label>
                  <select
                    value={projectDomain}
                    onChange={(e) => setProjectDomain(e.target.value)}
                    className="w-full text-sm bg-black border border-brand-border text-white px-3 py-2.5 rounded-lg focus:outline-none focus:border-brand-gold"
                  >
                    <option value="Artificial Intelligence">Artificial Intelligence</option>
                    <option value="Machine Learning">Machine Learning</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Full Stack Development">Full Stack Development</option>
                    <option value="Database Development">Database Development</option>
                    <option value="Mobile App Development">Mobile App Development</option>
                    <option value="Testing & QA">Testing & QA</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Problem Statement *
                </label>
                <textarea
                  required
                  rows={3}
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                  placeholder="State the problem clearly..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Detailed Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                  placeholder="Provide details of the project requirements..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                    Technologies / Tools Required
                  </label>
                  <input
                    type="text"
                    value={technologies}
                    onChange={(e) => setTechnologies(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                    placeholder="e.g. React, Node.js, Prisma, PostgreSQL"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                    Expected Outcome
                  </label>
                  <input
                    type="text"
                    value={expectedOutcome}
                    onChange={(e) => setExpectedOutcome(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                    placeholder="e.g. Completed API with documentation"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                    Project Duration *
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full text-sm bg-black border border-brand-border text-white px-3 py-2.5 rounded-lg focus:outline-none focus:border-brand-gold"
                  >
                    <option value="30 Days">30 Days</option>
                    <option value="45 Days">45 Days</option>
                    <option value="60 Days">60 Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm text-zinc-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                    Final Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={finalDeadline}
                    onChange={(e) => setFinalDeadline(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm text-zinc-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Weekly Milestones
                </label>
                <textarea
                  rows={2}
                  value={weeklyMilestones}
                  onChange={(e) => setWeeklyMilestones(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                  placeholder="Week 1: Setup DB. Week 2: Build endpoints..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Special Instructions
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                  placeholder="Any guidelines or details..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text uppercase tracking-wider mb-2">
                  Attachment (PDF/DOCX/ZIP)
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.zip"
                  onChange={(e) => e.target.files && setFile(e.target.files[0])}
                  className="w-full text-zinc-400 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-brand-gold file:cursor-pointer hover:file:bg-zinc-800"
                />
              </div>

              {/* Filter and Assign Interns */}
              <div className="border-t border-brand-border pt-4">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs uppercase font-bold tracking-wider text-brand-gold flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>Select Interns to Assign ({selectedInterns.length} Selected)</span>
                  </p>
                  
                  {/* Duration Batch Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-brand-muted font-bold">Filter duration:</span>
                    <select
                      value={durationFilter}
                      onChange={(e) => setDurationFilter(e.target.value)}
                      className="text-xs bg-zinc-900 border border-brand-border text-white px-2.5 py-1 rounded focus:outline-none focus:border-brand-gold"
                    >
                      <option value="All">All</option>
                      <option value="30 Days">30 Days</option>
                      <option value="45 Days">45 Days</option>
                      <option value="60 Days">60 Days</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1 bg-zinc-900 border border-brand-border text-brand-gold text-xs font-semibold rounded hover:bg-zinc-800"
                  >
                    {selectedInterns.length === matchingInterns.length ? 'Deselect All' : 'Select All matching'}
                  </button>
                </div>

                <div className="p-3 bg-black/60 border border-brand-border rounded-xl max-h-40 overflow-y-auto space-y-2 grid grid-cols-1 md:grid-cols-2 gap-x-4">
                  {matchingInterns.map((intern) => (
                    <label key={intern.id} className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer hover:text-white transition">
                      <input
                        type="checkbox"
                        checked={selectedInterns.includes(intern.id)}
                        onChange={() => handleCheckboxChange(intern.id)}
                        className="accent-brand-gold"
                      />
                      <span>
                        {intern.name} (Roll #{intern.rollNo}) - <strong className="text-brand-gold">{intern.duration}</strong>
                      </span>
                    </label>
                  ))}
                  {matchingInterns.length === 0 && (
                    <p className="text-zinc-500 text-xs italic p-2 col-span-2 text-center">
                      No interns matching domain "{projectDomain}" and duration "{durationFilter}" under your group.
                    </p>
                  )}
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
                  {submitting ? 'Assigning...' : 'Assign Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
