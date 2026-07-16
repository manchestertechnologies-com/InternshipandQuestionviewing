'use client';

import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Clock,
  Download,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  FileText,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  Edit,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X
} from 'lucide-react';
import ImageCropper from '@/components/ImageCropper';

interface QuestionImage {
  id?: string;
  imageUrl: string;
  type: string;
}

interface Question {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  detailedSolution: string;
  subject: string;
  topic: string;
  subTopic: string | null;
  concept: string;
  subConcept: string | null;
  classVal: string;
  examType: string;
  difficulty: string;
  status: string;
  reviewFeedback: string | null;
  images: QuestionImage[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  fileUrl: string | null;
  fileName: string | null;
  deadlineDays: number;
  createdAt: string;
}

interface TaskAssignment {
  id: string;
  status: string;
  completedAt: string | null;
  task: Task;
  questions: Question[];
}

export default function DailyTasksPage() {
  const [assignments, setAssignments] = useState<TaskAssignment[]>([]);
  const [selectedAsg, setSelectedAsg] = useState<TaskAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states for active question
  const [activeQId, setActiveQId] = useState<string | null>(null); // null = creating new
  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [detailedSolution, setDetailedSolution] = useState('');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [subTopic, setSubTopic] = useState('');
  const [concept, setConcept] = useState('');
  const [subConcept, setSubConcept] = useState('');
  const [classVal, setClassVal] = useState('11th');
  const [examType, setExamType] = useState('JEE');
  const [images, setImages] = useState<QuestionImage[]>([]);

  // Cropper states
  const [showCropper, setShowCropper] = useState(false);
  const [cropTargetType, setCropTargetType] = useState('QUESTION'); // 'QUESTION', 'OPTION_A', 'SOLUTION', etc.

  // Zoom for PDF
  const [pdfZoom, setPdfZoom] = useState(100);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; mins: number; secs: number } | null>(null);
  const [deadlineAlert, setDeadlineAlert] = useState('');

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/intern/tasks');
      if (!res.ok) throw new Error('Failed to load daily tasks');
      const data = await res.json();
      setAssignments(data);
      if (data.length > 0) {
        // Preserving active selection if possible, otherwise default to first
        const matched = data.find((a: any) => a.id === selectedAsg?.id);
        setSelectedAsg(matched || data[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Update countdown timer when selected assignment changes
  useEffect(() => {
    if (!selectedAsg) return;

    const calculateTime = () => {
      const task = selectedAsg.task;
      const createdTime = new Date(task.createdAt).getTime();
      const deadlineTime = createdTime + (task.deadlineDays * 24 * 60 * 60 * 1000);
      const diff = deadlineTime - Date.now();

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
        setDeadlineAlert('OVERDUE');
        return;
      }

      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      const secs = Math.floor((diff % (60 * 1000)) / 1000);

      setTimeLeft({ days, hours, mins, secs });

      // Determine alert string
      if (days === 0 && hours < 12) {
        setDeadlineAlert('TODAY (CRITICAL)');
      } else if (days === 0) {
        setDeadlineAlert('TOMORROW');
      } else if (days < 2) {
        setDeadlineAlert('APPROACHING DEADLINE');
      } else {
        setDeadlineAlert('');
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [selectedAsg]);

  const loadQuestionForEdit = (q: Question) => {
    setActiveQId(q.id);
    setQuestionText(q.questionText);
    setOptionA(q.optionA);
    setOptionB(q.optionB);
    setOptionC(q.optionC);
    setOptionD(q.optionD);
    setCorrectAnswer(q.correctAnswer);
    setDetailedSolution(q.detailedSolution);
    setSubject(q.subject);
    setTopic(q.topic);
    setSubTopic(q.subTopic || '');
    setConcept(q.concept);
    setSubConcept(q.subConcept || '');
    setClassVal(q.classVal);
    setExamType(q.examType);
    setImages(q.images);
  };

  const clearForm = () => {
    setActiveQId(null);
    setQuestionText('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setCorrectAnswer('A');
    setDetailedSolution('');
    setSubject('');
    setTopic('');
    setSubTopic('');
    setConcept('');
    setSubConcept('');
    setClassVal('11th');
    setExamType('JEE');
    setImages([]);
  };

  const handleSaveQuestion = async () => {
    if (!selectedAsg) return;
    setError('');
    setSuccess('');

    if (!questionText || !optionA || !optionB || !optionC || !optionD || !subject || !topic || !concept) {
      setError('Please fill in all required question fields & metadata.');
      return;
    }

    try {
      const isEdit = !!activeQId;
      const url = isEdit
        ? `/api/intern/tasks/${selectedAsg.id}/questions/${activeQId}`
        : `/api/intern/tasks/${selectedAsg.id}/questions`;

      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText,
          optionA,
          optionB,
          optionC,
          optionD,
          correctAnswer,
          detailedSolution,
          subject,
          topic,
          subTopic,
          concept,
          subConcept,
          classVal,
          examType,
          images,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save question');

      setSuccess(isEdit ? 'Question updated successfully!' : 'Question added successfully!');
      clearForm();
      fetchAssignments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!selectedAsg || !confirm('Are you sure you want to delete this question?')) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/intern/tasks/${selectedAsg.id}/questions/${qId}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete question');

      setSuccess('Question deleted successfully!');
      if (activeQId === qId) clearForm();
      fetchAssignments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedAsg) return;
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/intern/tasks/${selectedAsg.id}/complete`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete task');

      setSuccess('Task marked as completed! Your mentor has been notified.');
      fetchAssignments();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCropComplete = (base64Url: string) => {
    setImages((prev) => [...prev, { imageUrl: base64Url, type: cropTargetType }]);
    setShowCropper(false);
  };

  const removeCroppedImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-gold" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="glass-panel p-12 rounded-2xl border border-brand-border text-center text-brand-muted italic h-[50vh] flex flex-col justify-center items-center">
        <ClipboardList className="w-12 h-12 text-zinc-700 mb-4" />
        <p>No daily tasks assigned to you yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[85vh] space-y-6">
      {/* Top Header Selector & Deadline */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0 bg-black/40">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-xs font-semibold text-brand-gold uppercase tracking-wider">Active Task:</span>
          <select
            value={selectedAsg?.id}
            onChange={(e) => {
              const matched = assignments.find((a) => a.id === e.target.value);
              if (matched) {
                setSelectedAsg(matched);
                clearForm();
              }
            }}
            className="text-sm bg-black border border-brand-border text-white px-3 py-2 rounded-lg focus:outline-none focus:border-brand-gold w-64"
          >
            {assignments.map((asg) => (
              <option key={asg.id} value={asg.id}>
                {asg.task.title}
              </option>
            ))}
          </select>
        </div>

        {/* Countdown timer & Completion trigger */}
        {selectedAsg && (
          <div className="flex flex-wrap items-center gap-4">
            {timeLeft && (
              <div className="flex items-center gap-3">
                {deadlineAlert && (
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full animate-pulse border ${
                    deadlineAlert.includes('CRITICAL')
                      ? 'bg-red-500/10 text-red-400 border-red-500/20'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {deadlineAlert}
                  </span>
                )}
                
                <div className="flex gap-2 text-xs bg-black/80 border border-brand-border p-2 rounded-xl text-center">
                  <div className="px-1"><span className="font-bold text-white block">{timeLeft.days}d</span><span className="text-[9px] text-brand-muted uppercase">Days</span></div>
                  <div className="px-1"><span className="font-bold text-white block">{timeLeft.hours}h</span><span className="text-[9px] text-brand-muted uppercase">Hours</span></div>
                  <div className="px-1"><span className="font-bold text-white block">{timeLeft.mins}m</span><span className="text-[9px] text-brand-muted uppercase">Mins</span></div>
                  <div className="px-1"><span className="font-bold text-brand-gold block">{timeLeft.secs}s</span><span className="text-[9px] text-brand-muted uppercase">Secs</span></div>
                </div>
              </div>
            )}

            {selectedAsg.status !== 'COMPLETED' ? (
              <button
                onClick={handleMarkComplete}
                className="flex items-center gap-1.5 py-2.5 px-5 bg-brand-gold text-black hover:bg-brand-gold-hover font-bold rounded-lg shadow-lg shadow-brand-gold/15 transition cursor-pointer btn-gold border-0 shrink-0 text-sm"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Mark Task Completed</span>
              </button>
            ) : (
              <span className="flex items-center gap-1.5 py-2.5 px-5 bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 font-semibold rounded-lg shrink-0 text-sm">
                <CheckCircle className="w-5 h-5" /> Verified Completed
              </span>
            )}
          </div>
        )}
      </div>

      {success && (
        <div className="bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-lg text-sm text-center shrink-0">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm text-center shrink-0">
          {error}
        </div>
      )}

      {/* Main Split Screen container */}
      {selectedAsg && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[60vh]">
          
          {/* LEFT PANEL: Document Viewer */}
          <div className="glass-panel rounded-2xl border border-brand-border flex flex-col bg-black/40 overflow-hidden h-[68vh] lg:h-auto">
            <div className="p-4 border-b border-brand-border flex items-center justify-between shrink-0 bg-black/60">
              <span className="text-xs font-bold text-brand-gold uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                <span>Worksheet Attachment</span>
              </span>
              
              {selectedAsg.task.fileUrl?.endsWith('.pdf') && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPdfZoom((z) => Math.max(50, z - 10))}
                    className="p-1 bg-zinc-900 border border-brand-border rounded text-brand-gold hover:bg-zinc-800 transition cursor-pointer"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-semibold text-brand-muted">{pdfZoom}%</span>
                  <button
                    onClick={() => setPdfZoom((z) => Math.min(200, z + 10))}
                    className="p-1 bg-zinc-900 border border-brand-border rounded text-brand-gold hover:bg-zinc-800 transition cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-between bg-zinc-950/40">
              {selectedAsg.task.fileUrl ? (
                selectedAsg.task.fileUrl.toLowerCase().endsWith('.pdf') ? (
                  <div
                    className="w-full h-full min-h-[450px] transition-transform duration-100 ease-out origin-top-left"
                    style={{ transform: `scale(${pdfZoom / 100})`, width: `${100 / (pdfZoom / 100)}%`, height: `${100 / (pdfZoom / 100)}%` }}
                  >
                    <iframe
                      src={selectedAsg.task.fileUrl}
                      className="w-full h-full rounded-lg border border-brand-border bg-white"
                    />
                  </div>
                ) : (
                  <div className="my-auto text-center space-y-4 max-w-sm mx-auto p-6 bg-black/60 border border-brand-border rounded-2xl">
                    <FileText className="w-12 h-12 text-brand-gold mx-auto" />
                    <div>
                      <h4 className="font-bold text-white text-base truncate">{selectedAsg.task.fileName}</h4>
                      <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                        DOCX files cannot be previewed natively. Please download the file to view the worksheet on your system.
                      </p>
                    </div>
                    <a
                      href={selectedAsg.task.fileUrl}
                      download
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-zinc-900 border border-brand-border hover:bg-zinc-850 text-brand-gold text-xs font-semibold rounded-lg transition cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Worksheet</span>
                    </a>
                  </div>
                )
              ) : (
                <div className="my-auto text-center text-brand-muted italic py-12">
                  No worksheets attached for this task. Please read the description.
                </div>
              )}

              {/* Task Details description card */}
              <div className="mt-4 p-4 bg-black/60 border border-brand-border rounded-xl">
                <h4 className="text-xs uppercase font-extrabold tracking-wider text-brand-gold mb-1.5">Task Instructions</h4>
                <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">{selectedAsg.task.description}</p>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL: Question Form & Submissions list */}
          <div className="flex flex-col gap-6 overflow-y-auto">
            {/* Drafted list */}
            <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-brand-border">
                <span className="text-xs font-bold text-brand-gold uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4" />
                  <span>Submitted Questions ({selectedAsg.questions.length})</span>
                </span>
                
                <button
                  type="button"
                  onClick={clearForm}
                  className="flex items-center gap-1 py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-brand-gold rounded border border-brand-border text-xs font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> New Question
                </button>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedAsg.questions.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-black/45 border border-brand-border rounded-xl flex items-center justify-between text-xs hover:border-brand-gold/20 transition">
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate max-w-xs">{q.questionText}</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9px] text-brand-muted mt-1 max-w-lg">
                        <div>Chapter (Topic): <span className="text-zinc-300 font-medium">{q.topic}</span></div>
                        <div>Concept: <span className="text-zinc-300 font-medium">{q.concept}</span></div>
                        <div>Sub-Concept: <span className="text-zinc-300 font-medium">{q.subConcept || 'N/A'}</span></div>
                        <div>Class: <span className="text-zinc-300 font-medium">{q.classVal}</span></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        q.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                        q.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                        q.status === 'CORRECTION_REQUESTED' ? 'bg-amber-500/10 text-amber-400 animate-pulse' :
                        'bg-zinc-500/10 text-zinc-400'
                      }`}>
                        {q.status}
                      </span>
                      <button
                        onClick={() => loadQuestionForEdit(q)}
                        className="p-1 bg-zinc-900 border border-brand-border rounded text-brand-gold hover:bg-zinc-800 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1 bg-red-950/20 border border-red-900/30 rounded text-red-400 hover:bg-red-950/50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {selectedAsg.questions.length === 0 && (
                  <div className="text-center text-brand-muted text-xs italic py-4 bg-zinc-950/30 border border-brand-border border-dashed rounded-lg">
                    No questions logged for this task yet
                  </div>
                )}
              </div>
            </div>

            {/* Question Entry Form */}
            <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-6">
              <div className="border-b border-brand-border pb-3">
                <h3 className="font-bold text-white text-base">
                  {activeQId ? 'Edit Question Draft' : 'Add New Question'}
                </h3>
                <p className="text-[10px] text-brand-muted uppercase font-bold mt-0.5 tracking-widest">Question Entry Form</p>
              </div>

              {/* Subject & Topic metadata (required) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Subject (NCERT) *</label>
                  <select
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                  >
                    <option value="">Select Subject</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Mathematics">Mathematics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Chapter Name (Topic) *</label>
                  <input
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                    placeholder="e.g. Limits & Continuity"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Sub-Topic</label>
                  <input
                    type="text"
                    value={subTopic}
                    onChange={(e) => setSubTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                    placeholder="e.g. L'Hopital's Rule"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Concept (NCERT) *</label>
                  <input
                    type="text"
                    required
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                    placeholder="e.g. Indeterminate forms"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Sub-Concept</label>
                  <input
                    type="text"
                    value={subConcept}
                    onChange={(e) => setSubConcept(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                    placeholder="e.g. 0/0 form"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Class *</label>
                  <select
                    value={classVal}
                    onChange={(e) => setClassVal(e.target.value)}
                    className="w-full text-xs bg-black border border-brand-border text-white px-2 py-2 rounded-lg focus:outline-none focus:border-brand-gold"
                  >
                    <option value="11th">11th</option>
                    <option value="12th">12th</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Exam Type *</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full text-xs bg-black border border-brand-border text-white px-2 py-2 rounded-lg focus:outline-none focus:border-brand-gold"
                  >
                    <option value="JEE">JEE</option>
                    <option value="NEET">NEET</option>
                    <option value="KCET">KCET</option>
                    <option value="CET">CET</option>
                  </select>
                </div>
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Question Text *</label>
                <textarea
                  required
                  rows={4}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs leading-relaxed"
                  placeholder="Enter the question text. Rich formatting and LaTeX notation supported."
                />
              </div>

              {/* Option Blocks */}
              <div className="space-y-3">
                <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider">Options *</label>
                {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                  <div key={opt} className="flex gap-3 items-center">
                    <span className="w-6 h-6 rounded-full bg-zinc-900 border border-brand-border flex items-center justify-center font-bold text-xs text-brand-gold shrink-0">
                      {opt}
                    </span>
                    <input
                      type="text"
                      required
                      value={opt === 'A' ? optionA : opt === 'B' ? optionB : opt === 'C' ? optionC : optionD}
                      onChange={(e) => {
                        if (opt === 'A') setOptionA(e.target.value);
                        else if (opt === 'B') setOptionB(e.target.value);
                        else if (opt === 'C') setOptionC(e.target.value);
                        else setOptionD(e.target.value);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                      placeholder={`Enter Option ${opt}`}
                    />
                  </div>
                ))}
              </div>

              {/* Correct Answer Dropdown */}
              <div className="w-1/2">
                <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Correct Option *</label>
                <select
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="w-full text-xs bg-black border border-brand-border text-white px-2 py-2 rounded-lg focus:outline-none focus:border-brand-gold"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              {/* Detailed Solution */}
              <div>
                <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Detailed Solution *</label>
                <textarea
                  required
                  rows={4}
                  value={detailedSolution}
                  onChange={(e) => setDetailedSolution(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs leading-relaxed"
                  placeholder="Provide step-by-step solution derivation details..."
                />
              </div>

              {/* Attached Images & Cropper Toggle */}
              <div className="space-y-3">
                <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider">Crop Option Diagrams</label>
                
                <div className="flex gap-2">
                  <select
                    value={cropTargetType}
                    onChange={(e) => setCropTargetType(e.target.value)}
                    className="text-xs bg-black border border-brand-border text-white px-2 py-1.5 rounded-lg focus:outline-none focus:border-brand-gold"
                  >
                    <option value="QUESTION">Question diagram</option>
                    <option value="OPTION_A">Option A diagram</option>
                    <option value="OPTION_B">Option B diagram</option>
                    <option value="OPTION_C">Option C diagram</option>
                    <option value="OPTION_D">Option D diagram</option>
                    <option value="SOLUTION">Solution diagram</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowCropper(true)}
                    className="flex items-center gap-1.5 py-1.5 px-3 bg-zinc-900 border border-brand-border rounded text-xs font-semibold text-brand-gold hover:bg-zinc-800 transition cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Launch Cropper</span>
                  </button>
                </div>

                {showCropper && (
                  <ImageCropper
                    onCropComplete={handleCropComplete}
                    onCancel={() => setShowCropper(false)}
                  />
                )}

                {/* Render attached cropped images */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border border-brand-border p-3 bg-black/60 rounded-xl">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative bg-zinc-950 p-2 rounded-lg border border-brand-border flex flex-col items-center">
                        <img
                          src={img.imageUrl}
                          alt="Cropped diagram asset"
                          className="max-h-20 object-contain rounded"
                        />
                        <span className="text-[9px] uppercase tracking-wider font-bold text-brand-muted mt-1.5">
                          {img.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCroppedImage(idx)}
                          className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-900 border border-red-700/30 rounded-full text-white cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form buttons */}
              <div className="pt-4 border-t border-brand-border flex gap-3">
                <button
                  type="button"
                  onClick={clearForm}
                  className="flex-1 py-2 px-4 rounded-lg bg-zinc-900 border border-brand-border hover:bg-zinc-850 text-zinc-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancel / Clear
                </button>
                
                <button
                  type="button"
                  onClick={handleSaveQuestion}
                  className="flex-1 py-2 px-4 rounded-lg bg-brand-gold hover:bg-brand-gold-hover text-black text-xs font-bold transition cursor-pointer btn-gold border-0 flex items-center justify-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Question Draft</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
