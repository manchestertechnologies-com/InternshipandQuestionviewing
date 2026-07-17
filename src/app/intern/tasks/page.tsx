'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Paperclip,
  X
} from 'lucide-react';
import ImageCropper from '@/components/ImageCropper';
import { ACADEMIC_HIERARCHY, getChapters, getConcepts } from '@/lib/academicHierarchy';

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

  // Image upload indicators
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // References for autofocus
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Cropper states (optional helper)
  const [showCropper, setShowCropper] = useState(false);
  const [cropTargetType, setCropTargetType] = useState('QUESTION');

  // Zoom for PDF/DOCX
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

  // Update countdown timer based on same-day hour cutoff
  useEffect(() => {
    if (!selectedAsg) return;

    const calculateTime = () => {
      const task = selectedAsg.task;
      const createdTime = new Date(task.createdAt);
      
      // deadlineDays represents the same-day hour cutoff (e.g. 23 for 11:59:59 PM)
      const deadlineTime = new Date(createdTime);
      deadlineTime.setHours(task.deadlineDays, 59, 59, 999);
      
      const diff = deadlineTime.getTime() - Date.now();

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

      if (days === 0 && hours < 3) {
        setDeadlineAlert('TODAY (URGENT)');
      } else {
        setDeadlineAlert('TODAY');
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

    // Autofocus
    setTimeout(() => questionTextareaRef.current?.focus(), 100);
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
    setImages([]);
    // Do NOT clear subject, class, chapter, concept, examType etc. to optimize bulk entry
    setTimeout(() => questionTextareaRef.current?.focus(), 100);
  };

  const uploadImageDirect = async (fileBlob: Blob, type: string): Promise<string> => {
    setUploadingField(type);
    try {
      const signRes = await fetch('/api/cloudinary/sign?folder=manchester-tech/question-images');
      if (!signRes.ok) throw new Error('Failed to generate upload signature');
      const signData = await signRes.json();
      const { signature, timestamp, folder, apiKey, cloudName } = signData;

      const cloudinaryData = new FormData();
      cloudinaryData.append('file', fileBlob);
      cloudinaryData.append('api_key', apiKey);
      cloudinaryData.append('timestamp', timestamp.toString());
      cloudinaryData.append('signature', signature);
      cloudinaryData.append('folder', folder);

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: cloudinaryData,
        }
      );

      if (!cloudinaryRes.ok) {
        const errorData = await cloudinaryRes.json();
        throw new Error(errorData.error?.message || 'Image upload failed');
      }

      const uploadResult = await cloudinaryRes.json();
      return uploadResult.secure_url;
    } finally {
      setUploadingField(null);
    }
  };

  const handlePasteImage = async (e: React.ClipboardEvent<HTMLTextAreaElement | HTMLInputElement>, type: string) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const fileBlob = item.getAsFile();
        if (!fileBlob) return;

        try {
          const url = await uploadImageDirect(fileBlob, type);
          setImages((prev) => [...prev, { imageUrl: url, type }]);
          setSuccess(`Image pasted and attached to ${type} successfully!`);
        } catch (err: any) {
          setError(`Paste failed: ${err.message}`);
        }
      }
    }
  };

  const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileFile = e.target.files[0];
    try {
      const url = await uploadImageDirect(fileFile, type);
      setImages((prev) => [...prev, { imageUrl: url, type }]);
      setSuccess(`Image uploaded and attached to ${type} successfully!`);
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`);
    }
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter or Cmd+Enter triggers save
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSaveQuestion();
    }
  };

  const handleCropComplete = (base64Url: string) => {
    // Optional cropper output goes to Cloudinary signed upload
    fetch(base64Url)
      .then((res) => res.blob())
      .then(async (blob) => {
        try {
          const url = await uploadImageDirect(blob, cropTargetType);
          setImages((prev) => [...prev, { imageUrl: url, type: cropTargetType }]);
          setSuccess(`Cropped image attached to ${cropTargetType} successfully!`);
        } catch (err: any) {
          setError(`Upload failed: ${err.message}`);
        }
      });
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

  // Set up inline document viewer
  const fileUrl = selectedAsg?.task.fileUrl;
  const isPdf = fileUrl?.toLowerCase().endsWith('.pdf') || fileUrl?.startsWith('data:application/pdf');
  const isDocx = fileUrl?.toLowerCase().endsWith('.docx') || fileUrl?.toLowerCase().endsWith('.doc');
  const docViewerUrl = isPdf
    ? fileUrl
    : isDocx
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl || '')}`
      : null;

  // Academic hierarchy values based on selection
  const chapters = subject ? getChapters(subject, classVal) : [];
  const concepts = (subject && topic) ? getConcepts(subject, classVal, topic) : [];
  const conceptObj = concepts.find((c) => c.name === concept);
  const subConcepts = conceptObj ? conceptObj.subConcepts : [];

  return (
    <div className="flex flex-col h-full min-h-[85vh] space-y-6" onKeyDown={handleKeyDown}>
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
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full animate-pulse border bg-amber-500/10 text-brand-gold border-brand-gold/20`}>
                  {deadlineAlert}
                </span>
                
                <div className="flex gap-2 text-xs bg-black/80 border border-brand-border p-2 rounded-xl text-center">
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
              
              {docViewerUrl && (
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
              {docViewerUrl ? (
                <div
                  className="w-full h-full min-h-[500px] transition-transform duration-100 ease-out origin-top-left"
                  style={{ transform: `scale(${pdfZoom / 100})`, width: `${100 / (pdfZoom / 100)}%`, height: `${100 / (pdfZoom / 100)}%` }}
                >
                  <iframe
                    src={docViewerUrl}
                    className="w-full h-full rounded-lg border border-brand-border bg-white"
                  />
                </div>
              ) : fileUrl ? (
                <div className="my-auto text-center space-y-4 max-w-sm mx-auto p-6 bg-black/60 border border-brand-border rounded-2xl">
                  <FileText className="w-12 h-12 text-brand-gold mx-auto" />
                  <div>
                    <h4 className="font-bold text-white text-base truncate">{selectedAsg.task.fileName}</h4>
                    <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                      Attachment format not previewable. Please download the file to view the worksheet.
                    </p>
                  </div>
                  <a
                    href={fileUrl}
                    download
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-zinc-900 border border-brand-border hover:bg-zinc-850 text-brand-gold text-xs font-semibold rounded-lg transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Worksheet</span>
                  </a>
                </div>
              ) : (
                <div className="my-auto text-center text-brand-muted italic py-12">
                  No worksheets attached for this task. Please read instructions.
                </div>
              )}

              {/* Task Details description card */}
              <div className="mt-4 p-4 bg-black/60 border border-brand-border rounded-xl shrink-0">
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
                        <div>Class: <span className="text-zinc-300 font-medium">{q.classVal}</span></div>
                        <div>Difficulty: <span className="text-brand-gold font-medium">{q.difficulty}</span></div>
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
                    No questions logged for this task yet (Target: 100–110 Questions)
                  </div>
                )}
              </div>
            </div>

            {/* Question Entry Form */}
            <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-6">
              <div className="border-b border-brand-border pb-3 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white text-base">
                    {activeQId ? 'Edit Question Draft' : 'Add New Question'}
                  </h3>
                  <p className="text-[10px] text-brand-muted uppercase font-bold mt-0.5 tracking-widest">Question Entry Form (Press Ctrl+Enter to Save)</p>
                </div>
                <span className="text-[10px] bg-white/5 border border-zinc-800 text-brand-muted px-2 py-0.5 rounded font-mono">
                  {images.length} images attached
                </span>
              </div>

              {/* Subject & Class Select (NCERT Trigger Chapters) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Subject (NCERT) *</label>
                  <select
                    required
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      setTopic('');
                      setConcept('');
                      setSubConcept('');
                    }}
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
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Class *</label>
                  <select
                    value={classVal}
                    onChange={(e) => {
                      setClassVal(e.target.value);
                      setTopic('');
                      setConcept('');
                      setSubConcept('');
                    }}
                    className="w-full text-xs bg-black border border-brand-border text-white px-2 py-2 rounded-lg focus:outline-none focus:border-brand-gold"
                  >
                    <option value="11th">Class 11</option>
                    <option value="12th">Class 12</option>
                  </select>
                </div>
              </div>

              {/* Dynamic NCERT Chapter (Topic) Loading */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">NCERT Chapter (Topic) *</label>
                  <select
                    required
                    value={topic}
                    onChange={(e) => {
                      setTopic(e.target.value);
                      setConcept('');
                      setSubConcept('');
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                    disabled={!subject}
                  >
                    <option value="">Select Chapter</option>
                    {chapters.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Dynamic Concept selection */}
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Concept (NCERT) *</label>
                  <select
                    required
                    value={concept}
                    onChange={(e) => {
                      setConcept(e.target.value);
                      setSubConcept('');
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                    disabled={!topic}
                  >
                    <option value="">Select Concept</option>
                    {concepts.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Subconcept & Exam type */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Sub-Concept</label>
                  <select
                    value={subConcept}
                    onChange={(e) => setSubConcept(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                    disabled={!concept}
                  >
                    <option value="">Select Sub-Concept</option>
                    {subConcepts.map((sc) => (
                      <option key={sc} value={sc}>
                        {sc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider mb-2">Sub-Topic / Tag</label>
                  <input
                    type="text"
                    value={subTopic}
                    onChange={(e) => setSubTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                    placeholder="e.g. Free-body diagram"
                  />
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

              {/* Question Text with paste and attachment support */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider">Question Text *</label>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1 text-[9px] font-bold text-brand-gold cursor-pointer bg-zinc-900 border border-brand-border px-2 py-0.5 rounded hover:bg-zinc-800">
                      <Paperclip className="w-3 h-3" />
                      <span>Attach Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleUploadImageFile(e, 'QUESTION')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                
                <textarea
                  ref={questionTextareaRef}
                  required
                  rows={4}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  onPaste={(e) => handlePasteImage(e, 'QUESTION')}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs leading-relaxed"
                  placeholder="Type question text or paste image (Ctrl+V) directly inside here..."
                />
                
                {uploadingField === 'QUESTION' && <p className="text-[10px] text-brand-gold animate-pulse">Uploading Question image to Cloudinary...</p>}
                
                {/* Image previews for Question field */}
                {images.filter((img) => img.type === 'QUESTION').map((img, i) => (
                  <div key={i} className="inline-flex items-center gap-2 bg-zinc-900 p-1.5 rounded-lg border border-brand-border mt-1">
                    <img src={img.imageUrl} alt="Question Asset" className="max-h-12 object-contain rounded" />
                    <button type="button" onClick={() => removeCroppedImage(images.indexOf(img))} className="text-red-400 hover:text-white p-0.5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Options with paste-to-attach support */}
              <div className="space-y-3">
                <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider">Options *</label>
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const fieldName = `OPTION_${opt}`;
                  return (
                    <div key={opt} className="space-y-1">
                      <div className="flex gap-3 items-center">
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
                          onPaste={(e) => handlePasteImage(e, fieldName)}
                          className="flex-1 px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs"
                          placeholder={`Type Option ${opt} text or paste image (Ctrl+V)...`}
                        />

                        <label className="p-1.5 bg-zinc-900 border border-brand-border rounded text-brand-gold hover:bg-zinc-800 cursor-pointer">
                          <Paperclip className="w-3.5 h-3.5" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleUploadImageFile(e, fieldName)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      {uploadingField === fieldName && <p className="text-[10px] text-brand-gold animate-pulse pl-9">Uploading Option {opt} image...</p>}

                      {/* Option image previews */}
                      {images.filter((img) => img.type === fieldName).map((img, i) => (
                        <div key={i} className="inline-flex items-center gap-2 bg-zinc-900 p-1.5 rounded-lg border border-brand-border mt-1 ml-9">
                          <img src={img.imageUrl} alt={`Option ${opt} Asset`} className="max-h-10 object-contain rounded" />
                          <button type="button" onClick={() => removeCroppedImage(images.indexOf(img))} className="text-red-400 hover:text-white p-0.5">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })}
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

              {/* Detailed Solution with paste-to-attach */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-semibold text-brand-text uppercase tracking-wider">Detailed Solution *</label>
                  <label className="flex items-center gap-1 text-[9px] font-bold text-brand-gold cursor-pointer bg-zinc-900 border border-brand-border px-2 py-0.5 rounded hover:bg-zinc-800">
                    <Paperclip className="w-3 h-3" />
                    <span>Attach Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadImageFile(e, 'SOLUTION')}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <textarea
                  required
                  rows={4}
                  value={detailedSolution}
                  onChange={(e) => setDetailedSolution(e.target.value)}
                  onPaste={(e) => handlePasteImage(e, 'SOLUTION')}
                  className="w-full px-3 py-2 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold text-xs leading-relaxed"
                  placeholder="Type step-by-step solution or paste image (Ctrl+V) directly inside..."
                />

                {uploadingField === 'SOLUTION' && <p className="text-[10px] text-brand-gold animate-pulse">Uploading Solution image...</p>}

                {/* Solution image previews */}
                {images.filter((img) => img.type === 'SOLUTION').map((img, i) => (
                  <div key={i} className="inline-flex items-center gap-2 bg-zinc-900 p-1.5 rounded-lg border border-brand-border mt-1">
                    <img src={img.imageUrl} alt="Solution Asset" className="max-h-12 object-contain rounded" />
                    <button type="button" onClick={() => removeCroppedImage(images.indexOf(img))} className="text-red-400 hover:text-white p-0.5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Optional Cropper tool button */}
              <div className="space-y-2 border-t border-brand-border/40 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-brand-muted uppercase font-bold">Image Bounding Cropper (Optional)</span>
                  <button
                    type="button"
                    onClick={() => setShowCropper(!showCropper)}
                    className="text-[10px] text-brand-gold hover:underline flex items-center gap-1 font-semibold"
                  >
                    <ImageIcon className="w-3 h-3" />
                    <span>{showCropper ? 'Close Cropper' : 'Open Cropper'}</span>
                  </button>
                </div>

                {showCropper && (
                  <div className="space-y-3 bg-black/60 border border-brand-border p-4 rounded-xl">
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
                    </div>
                    <ImageCropper onCropComplete={handleCropComplete} onCancel={() => setShowCropper(false)} />
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
                  <span>Save Draft (Ctrl+Enter)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
