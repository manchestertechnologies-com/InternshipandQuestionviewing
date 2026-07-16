'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Eye, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

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
  images: QuestionImage[];
}

export default function ViewerDashboard() {
  const { data: session } = useSession();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  useEffect(() => {
    // 1. Right-click, Copy, Cut, and Selection restrictions
    const preventContextMenu = (e: MouseEvent) => e.preventDefault();
    const preventCopy = (e: ClipboardEvent) => e.preventDefault();
    const preventCut = (e: ClipboardEvent) => e.preventDefault();

    window.addEventListener('contextmenu', preventContextMenu);
    window.addEventListener('copy', preventCopy);
    window.addEventListener('cut', preventCut);

    return () => {
      window.removeEventListener('contextmenu', preventContextMenu);
      window.removeEventListener('copy', preventCopy);
      window.removeEventListener('cut', preventCut);
    };
  }, []);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/viewer/questions');
      if (!res.ok) throw new Error('Failed to load approved repository');
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

  const email = session?.user?.email || 'viewer@manchester.com';
  // Repeated SVG background watermark
  const watermarkSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="250" height="250" viewBox="0 0 250 250">
      <text x="50%" y="50%" fill="rgba(255, 255, 255, 0.03)" font-size="10" font-family="monospace" text-anchor="middle" transform="rotate(-30 125 125)">
        ${email}
      </text>
    </svg>
  `;
  const watermarkUrl = `data:image/svg+xml;utf8,${encodeURIComponent(watermarkSvg)}`;

  const subjects = ['All', ...Array.from(new Set(questions.map((q) => q.subject)))];

  const filteredQuestions = questions.filter((q) => {
    const term = search.toLowerCase();
    const matchesSearch =
      q.questionText.toLowerCase().includes(term) ||
      q.subject.toLowerCase().includes(term) ||
      q.topic.toLowerCase().includes(term);

    const matchesSubject = subjectFilter === 'All' || q.subject === subjectFilter;
    const matchesClass = classFilter === 'All' || q.classVal === classFilter;
    const matchesDifficulty = difficultyFilter === 'All' || q.difficulty === difficultyFilter;

    return matchesSearch && matchesSubject && matchesClass && matchesDifficulty;
  });

  return (
    <div
      className="p-8 space-y-8 select-none min-h-screen relative"
      style={{
        backgroundImage: `url("${watermarkUrl}")`,
        backgroundRepeat: 'repeat',
      }}
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-gold-gradient">Approved Repository</h1>
          <p className="text-zinc-400 text-sm mt-1">Manchester Technologies official verified question bank catalog</p>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center justify-center gap-2 py-2 px-4 bg-zinc-900 border border-brand-border hover:bg-zinc-800 text-red-400 font-semibold rounded-lg transition cursor-pointer border-0 text-sm shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm text-center relative z-10">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col lg:flex-row gap-4 items-center relative z-10 bg-black/80">
        <div className="flex items-center gap-2 bg-black/40 border border-brand-border px-3 py-2 rounded-lg w-full lg:max-w-xs">
          <Search className="w-4 h-4 text-brand-muted" />
          <input
            type="text"
            placeholder="Search catalog..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none w-full"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full text-sm bg-black border border-brand-border text-white px-3 py-2.5 rounded-lg focus:outline-none focus:border-brand-gold"
          >
            <option value="All">All Subjects</option>
            {subjects
              .filter((s) => s !== 'All')
              .map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
          </select>
        </div>

        <div className="w-full sm:w-48">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full text-sm bg-black border border-brand-border text-white px-3 py-2.5 rounded-lg focus:outline-none focus:border-brand-gold"
          >
            <option value="All">All Classes</option>
            <option value="11th">11th</option>
            <option value="12th">12th</option>
          </select>
        </div>

        <div className="w-full sm:w-48">
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="w-full text-sm bg-black border border-brand-border text-white px-3 py-2.5 rounded-lg focus:outline-none focus:border-brand-gold"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center items-center relative z-10">
          <RefreshCw className="w-8 h-8 animate-spin text-brand-gold" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {filteredQuestions.map((q) => (
            <div
              key={q.id}
              className="glass-panel p-6 rounded-2xl border border-brand-border flex flex-col justify-between hover:border-brand-gold/30 transition duration-300 bg-black/80"
            >
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
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    {q.examType}
                  </span>
                </div>

                <p className="text-white font-medium text-sm line-clamp-3 leading-relaxed">
                  {q.questionText}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs text-brand-muted bg-black/30 p-3 rounded-lg border border-brand-border/40">
                  <div>Topic: <span className="text-zinc-300 font-medium">{q.topic}</span></div>
                  <div>Class: <span className="text-zinc-300 font-medium">{q.classVal}</span></div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-brand-border flex justify-end">
                <button
                  onClick={() => setSelectedQuestion(q)}
                  className="flex items-center gap-1.5 py-2 px-4 bg-zinc-900 border border-brand-border hover:bg-zinc-800 rounded-lg text-xs font-semibold text-brand-gold transition cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          ))}
          {filteredQuestions.length === 0 && (
            <div className="col-span-full py-12 text-center text-brand-muted italic bg-black/80 rounded-2xl border border-brand-border">
              No approved questions found matching the filters
            </div>
          )}
        </div>
      )}

      {/* Modal for Question Details */}
      {selectedQuestion && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel w-full max-w-4xl rounded-2xl border border-brand-border overflow-hidden shadow-2xl my-8 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-brand-border flex justify-between items-center bg-black/40 shrink-0">
              <div>
                <h2 className="font-bold text-lg text-white">Question Details</h2>
                <p className="text-xs text-brand-muted mt-1">Manchester Technologies Verified Catalog</p>
              </div>
              <button
                onClick={() => setSelectedQuestion(null)}
                className="text-zinc-500 hover:text-white transition cursor-pointer border-0 bg-transparent"
              >
                <span className="text-xl font-bold">×</span>
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
                  <p className="text-[10px] text-brand-muted uppercase font-bold">Difficulty</p>
                  <p className="text-sm font-semibold text-brand-gold mt-0.5">{selectedQuestion.difficulty}</p>
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
                  <h4 className="text-xs uppercase font-bold tracking-wider text-brand-gold">Diagrams & Equations</h4>
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
                  <div
                    key={opt}
                    className={`p-4 rounded-xl border flex gap-3 text-sm transition ${
                      selectedQuestion.correctAnswer === opt
                        ? 'bg-emerald-950/20 border-emerald-500/50 text-white'
                        : 'bg-zinc-950/40 border-brand-border text-zinc-300'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        selectedQuestion.correctAnswer === opt
                          ? 'bg-emerald-500 text-black'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
