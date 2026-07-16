'use client';

import React, { useState, useEffect } from 'react';
import { FileCheck, Search, Filter, Check, X, RefreshCw, AlertCircle, Eye } from 'lucide-react';

interface QuestionImage {
  id: string;
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
  intern: {
    name: string;
    rollNo: number;
  };
  images: QuestionImage[];
  createdAt: string;
}

export default function MentorReviewsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Search & Filter states
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Review states
  const [feedback, setFeedback] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/questions');
      if (!res.ok) throw new Error('Failed to load group questions');
      const data = await res.json();
      setQuestions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleReview = async (qId: string, newStatus: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/questions/${qId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reviewFeedback: feedback }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit review');
      }
      
      setFeedback('');
      setSelectedQuestion(null);
      fetchQuestions();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const subjects = ['All', ...Array.from(new Set(questions.map(q => q.subject)))];

  const filteredQuestions = questions.filter(q => {
    const term = search.toLowerCase();
    const matchesSearch = q.questionText.toLowerCase().includes(term) ||
      q.subject.toLowerCase().includes(term) ||
      q.topic.toLowerCase().includes(term) ||
      q.intern.name.toLowerCase().includes(term);

    const matchesSubject = subjectFilter === 'All' || q.subject === subjectFilter;
    const matchesStatus = statusFilter === 'All' || q.status === statusFilter;

    return matchesSearch && matchesSubject && matchesStatus;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gold-gradient">Review Questions</h1>
        <p className="text-zinc-400 text-sm mt-1">Approve, reject, or request corrections on intern-submitted questions</p>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 bg-black/40 border border-brand-border px-3 py-2 rounded-lg w-full md:max-w-xs">
          <Search className="w-4 h-4 text-brand-muted" />
          <input
            type="text"
            placeholder="Search questions or interns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none w-full"
          />
        </div>

        <div className="w-full md:w-48">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full text-sm bg-black border border-brand-border text-white px-3 py-2.5 rounded-lg focus:outline-none focus:border-brand-gold"
          >
            <option value="All">All Subjects</option>
            {subjects.filter(s => s !== 'All').map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-sm bg-black border border-brand-border text-white px-3 py-2.5 rounded-lg focus:outline-none focus:border-brand-gold"
          >
            <option value="All">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CORRECTION_REQUESTED">Correction Req.</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center items-center">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-gold" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredQuestions.map((q) => (
            <div key={q.id} className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col justify-between hover:border-brand-gold/30 transition duration-300">
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] bg-white/5 border border-brand-border px-2.5 py-0.5 rounded text-brand-muted uppercase font-bold tracking-wider">
                      {q.subject}
                    </span>
                    <span className="text-[10px] bg-brand-gold/10 border border-brand-gold/25 px-2.5 py-0.5 rounded text-brand-gold font-bold uppercase tracking-wider ml-2">
                      {q.difficulty}
                    </span>
                  </div>
                  
                  <span className={`text-[10px] px-2.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    q.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    q.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    q.status === 'CORRECTION_REQUESTED' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                  }`}>
                    {q.status}
                  </span>
                </div>

                <p className="text-white font-medium text-sm line-clamp-3 leading-relaxed">
                  {q.questionText}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs text-brand-muted bg-black/30 p-3 rounded-lg border border-brand-border/40">
                  <div>Topic: <span className="text-zinc-300 font-medium">{q.topic}</span></div>
                  <div>Class: <span className="text-zinc-300 font-medium">{q.classVal}</span></div>
                  <div>Exam: <span className="text-zinc-300 font-medium">{q.examType}</span></div>
                  <div>Author: <span className="text-zinc-300 font-medium">{q.intern.name} (Roll {q.intern.rollNo})</span></div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-brand-border flex justify-end">
                <button
                  onClick={() => {
                    setSelectedQuestion(q);
                    setFeedback(q.reviewFeedback || '');
                  }}
                  className="flex items-center gap-1.5 py-2 px-4 bg-zinc-900 border border-brand-border hover:bg-zinc-800 rounded-lg text-xs font-semibold text-brand-gold transition cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Review Question</span>
                </button>
              </div>
            </div>
          ))}
          {filteredQuestions.length === 0 && (
            <div className="col-span-full py-12 text-center text-brand-muted italic">
              No questions found matching the criteria
            </div>
          )}
        </div>
      )}

      {/* Review Details Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel w-full max-w-4xl rounded-2xl border border-brand-border overflow-hidden shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-brand-border flex justify-between items-center bg-black/40 shrink-0">
              <div>
                <h2 className="font-bold text-lg text-white">Review Question Details</h2>
                <p className="text-xs text-brand-muted mt-1">Submitted by {selectedQuestion.intern.name} (Roll #{selectedQuestion.intern.rollNo})</p>
              </div>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="text-zinc-500 hover:text-white transition cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-brand-border">
                  <p className="text-[10px] text-brand-muted uppercase font-bold">Subject</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{selectedQuestion.subject}</p>
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-brand-border">
                  <p className="text-[10px] text-brand-muted uppercase font-bold">Class</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{selectedQuestion.classVal}</p>
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-brand-border">
                  <p className="text-[10px] text-brand-muted uppercase font-bold">Exam Type</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{selectedQuestion.examType}</p>
                </div>
                <div className="bg-zinc-900/60 p-2.5 rounded-lg border border-brand-border">
                  <p className="text-[10px] text-brand-muted uppercase font-bold">Current Status</p>
                  <p className="text-sm font-semibold text-brand-gold mt-0.5">{selectedQuestion.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-brand-muted border-b border-brand-border pb-4">
                <div>Topic: <span className="text-zinc-300 font-medium">{selectedQuestion.topic}</span></div>
                <div>Sub Topic: <span className="text-zinc-300 font-medium">{selectedQuestion.subTopic || 'N/A'}</span></div>
                <div>Concept: <span className="text-zinc-300 font-medium">{selectedQuestion.concept}</span></div>
                <div>Sub Concept: <span className="text-zinc-300 font-medium">{selectedQuestion.subConcept || 'N/A'}</span></div>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-bold tracking-wider text-brand-gold">Question Text</h4>
                <div className="p-4 bg-zinc-950/60 rounded-xl border border-brand-border text-white text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedQuestion.questionText}
                </div>
              </div>

              {/* Question Images */}
              {selectedQuestion.images && selectedQuestion.images.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-brand-gold">Attached Cropped Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedQuestion.images.map((img) => (
                      <div key={img.id} className="relative bg-zinc-900 p-2 rounded-lg border border-brand-border flex flex-col items-center">
                        <img
                          src={img.imageUrl}
                          alt="Question asset"
                          className="max-h-32 object-contain"
                        />
                        <span className="text-[9px] uppercase tracking-wider font-bold text-brand-muted mt-2">
                          {img.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => (
                  <div key={opt} className={`p-4 rounded-xl border flex gap-3 text-sm transition ${
                    selectedQuestion.correctAnswer === opt
                      ? 'bg-emerald-950/20 border-emerald-500/50 text-white'
                      : 'bg-zinc-950/40 border-brand-border text-zinc-300'
                  }`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      selectedQuestion.correctAnswer === opt
                        ? 'bg-emerald-500 text-black'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {opt}
                    </span>
                    <div className="whitespace-pre-wrap">{selectedQuestion[`option${opt}`]}</div>
                  </div>
                ))}
              </div>

              {/* Detailed Solution */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-bold tracking-wider text-emerald-400">Detailed Solution</h4>
                <div className="p-4 bg-emerald-950/5 border border-emerald-900/30 rounded-xl text-white text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedQuestion.detailedSolution}
                </div>
              </div>

              {/* Review Section */}
              <div className="border-t border-brand-border pt-6 space-y-4">
                <h4 className="text-xs uppercase font-bold tracking-wider text-brand-gold">Mentor Action Room</h4>
                
                <div>
                  <label className="block text-xs text-brand-text mb-2 font-medium">Review Comments / Feedback</label>
                  <textarea
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold transition duration-200 text-sm"
                    placeholder="Provide correction details or rejection reason..."
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleReview(selectedQuestion.id, 'APPROVED')}
                    disabled={updating}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-sm transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 border-0"
                  >
                    <Check className="w-5 h-5" />
                    <span>Approve & Award Points</span>
                  </button>
                  <button
                    onClick={() => handleReview(selectedQuestion.id, 'CORRECTION_REQUESTED')}
                    disabled={updating}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 border-0"
                  >
                    <AlertCircle className="w-5 h-5" />
                    <span>Request Correction</span>
                  </button>
                  <button
                    onClick={() => handleReview(selectedQuestion.id, 'REJECTED')}
                    disabled={updating}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 border-0"
                  >
                    <X className="w-5 h-5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
