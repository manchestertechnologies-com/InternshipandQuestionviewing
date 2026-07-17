'use client';

import React, { useState, useEffect } from 'react';
import { FileCheck, Search, Filter, Check, X, RefreshCw, AlertCircle, Eye, ChevronRight, ChevronDown, BookOpen } from 'lucide-react';
import { ACADEMIC_HIERARCHY } from '@/lib/academicHierarchy';

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
  questionType?: string;
  extraData?: any;
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
  const [classFilter, setClassFilter] = useState('All');
  const [topicFilter, setTopicFilter] = useState('All');
  const [conceptFilter, setConceptFilter] = useState('All');
  const [subConceptFilter, setSubConceptFilter] = useState('All');
  const [questionTypeFilter, setQuestionTypeFilter] = useState('All');
  const [examFilter, setExamFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Tree expansion state
  const [expandedNodes, setExpandedNodes] = useState<string[]>(['Physics', 'Chemistry', 'Biology', 'Mathematics']);

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

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev =>
      prev.includes(nodeId)
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  // Helper to count questions at any level
  const getCount = (subj: string, cls?: string, chap?: string, conc?: string, subc?: string, qType?: string) => {
    return questions.filter(q => {
      if (q.subject !== subj) return false;
      if (cls) {
        const qCls = q.classVal === '11th' ? 'Class 11' : q.classVal === '12th' ? 'Class 12' : q.classVal;
        if (qCls !== cls) return false;
      }
      if (chap && q.topic !== chap) return false;
      if (conc && q.concept !== conc) return false;
      if (subc && q.subConcept !== subc) return false;
      if (qType) {
        const currentQType = (q as any).questionType || 'MCQ';
        if (currentQType !== qType) return false;
      }
      if (examFilter !== 'All') {
        const qExams = q.examType ? q.examType.split(',').map(s => s.trim()) : [];
        if (!qExams.includes(examFilter)) return false;
      }
      return true;
    }).length;
  };

  const clearAcademicFilters = () => {
    setSubjectFilter('All');
    setClassFilter('All');
    setTopicFilter('All');
    setConceptFilter('All');
    setSubConceptFilter('All');
    setQuestionTypeFilter('All');
  };

  const setHierarchyFilters = (subj: string, cls?: string, chap?: string, conc?: string, subc?: string, qType?: string) => {
    setSubjectFilter(subj);
    setClassFilter(cls ? (cls === 'Class 11' ? '11th' : '12th') : 'All');
    setTopicFilter(chap || 'All');
    setConceptFilter(conc || 'All');
    setSubConceptFilter(subc || 'All');
    setQuestionTypeFilter(qType || 'All');
  };

  const filteredQuestions = questions.filter(q => {
    const term = search.toLowerCase();
    const matchesSearch = q.questionText.toLowerCase().includes(term) ||
      q.subject.toLowerCase().includes(term) ||
      q.topic.toLowerCase().includes(term) ||
      q.intern.name.toLowerCase().includes(term);

    const matchesSubject = subjectFilter === 'All' || q.subject === subjectFilter;
    const matchesClass = classFilter === 'All' || q.classVal === classFilter;
    const matchesTopic = topicFilter === 'All' || q.topic === topicFilter;
    const matchesConcept = conceptFilter === 'All' || q.concept === conceptFilter;
    const matchesSubConcept = subConceptFilter === 'All' || q.subConcept === subConceptFilter;
    
    const qExams = q.examType ? q.examType.split(',').map(s => s.trim()) : [];
    const matchesExam = examFilter === 'All' || qExams.includes(examFilter);
    const matchesDifficulty = difficultyFilter === 'All' || q.difficulty === difficultyFilter;
    const matchesStatus = statusFilter === 'All' || q.status === statusFilter;

    const currentQType = (q as any).questionType || 'MCQ';
    const matchesQuestionType = questionTypeFilter === 'All' || currentQType === questionTypeFilter;

    return matchesSearch && matchesSubject && matchesClass && matchesTopic && matchesConcept && matchesSubConcept && matchesExam && matchesDifficulty && matchesStatus && matchesQuestionType;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gold-gradient">Review Questions</h1>
        <p className="text-zinc-400 text-sm mt-1">Approve, reject, or request corrections on intern questions using NCERT hierarchy</p>
      </div>

      {error && (
        <div className="bg-red-950/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm text-center">
          {error}
        </div>
      )}

      {/* Filters Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-brand-border space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-gold font-semibold">
            <Filter className="w-5 h-5" />
            <span>Filters & Search</span>
          </div>
          {(subjectFilter !== 'All' || classFilter !== 'All' || topicFilter !== 'All' || conceptFilter !== 'All' || subConceptFilter !== 'All' || questionTypeFilter !== 'All') && (
            <button
              onClick={clearAcademicFilters}
              className="text-xs text-red-400 hover:text-red-300 font-semibold"
            >
              Clear Academic Filters
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="flex items-center gap-2 bg-black/40 border border-brand-border px-3 py-2 rounded-lg">
            <Search className="w-4 h-4 text-brand-muted" />
            <input
              type="text"
              placeholder="Search text, topics, interns..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm text-white placeholder-zinc-500 focus:outline-none w-full"
            />
          </div>

          <div>
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="w-full text-sm bg-black border border-brand-border text-white px-3 py-2.5 rounded-lg focus:outline-none focus:border-brand-gold"
            >
              <option value="All">All Exams</option>
              <option value="JEE">JEE</option>
              <option value="NEET">NEET</option>
              <option value="KCET">KCET</option>
              <option value="CET">CET</option>
            </select>
          </div>

          <div>
            <select
              value={questionTypeFilter}
              onChange={(e) => setQuestionTypeFilter(e.target.value)}
              className="w-full text-sm bg-black border border-brand-border text-white px-3 py-2.5 rounded-lg focus:outline-none focus:border-brand-gold"
            >
              <option value="All">All Types</option>
              <option value="MCQ">MCQ</option>
              <option value="ASSERTION_REASON">Assertion & Reason</option>
              <option value="STATEMENT_BASED">Statement Based</option>
              <option value="TRUE_FALSE">True / False</option>
              <option value="MATCH_THE_FOLLOWING">Match the Following</option>
              <option value="NUMERICAL">Numerical</option>
              <option value="DIAGRAM">Diagram Based</option>
            </select>
          </div>

          <div>
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

          <div>
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

        {/* Selected Academic Path display */}
        {(subjectFilter !== 'All' || classFilter !== 'All' || topicFilter !== 'All' || questionTypeFilter !== 'All') && (
          <div className="bg-black/30 border border-brand-border/40 p-3 rounded-lg text-xs text-brand-muted flex flex-wrap gap-2 items-center">
            <span className="font-semibold text-brand-gold">Selected NCERT Path:</span>
            <span>{subjectFilter}</span>
            {classFilter !== 'All' && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span>Class {classFilter === '11th' ? '11' : '12'}</span>
              </>
            )}
            {topicFilter !== 'All' && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-white font-medium">{topicFilter}</span>
              </>
            )}
            {conceptFilter !== 'All' && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-white font-medium">{conceptFilter}</span>
              </>
            )}
            {subConceptFilter !== 'All' && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-white font-medium">{subConceptFilter}</span>
              </>
            )}
            {questionTypeFilter !== 'All' && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-brand-gold font-bold">{questionTypeFilter}</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT PANEL: Academic Hierarchy Tree Sidebar */}
        <div className="glass-panel p-4 rounded-2xl border border-brand-border h-[70vh] overflow-y-auto bg-black/20 space-y-4">
          <div className="pb-2 border-b border-brand-border flex items-center gap-2 text-brand-gold font-bold text-sm">
            <BookOpen className="w-4 h-4" />
            <span>NCERT Academic Hierarchy</span>
          </div>

          <div className="space-y-2 text-xs">
            {Object.keys(ACADEMIC_HIERARCHY).map((subj) => {
              const subjCount = getCount(subj);
              const isSubjExpanded = expandedNodes.includes(subj);
              const isSubjSelected = subjectFilter === subj && classFilter === 'All';

              return (
                <div key={subj} className="space-y-1">
                  <div
                    onClick={() => {
                      toggleNode(subj);
                      setHierarchyFilters(subj);
                    }}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                      isSubjSelected ? 'bg-brand-gold/15 text-brand-gold font-bold' : 'text-zinc-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      {isSubjExpanded ? <ChevronDown className="w-3.5 h-3.5 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                      <span className="truncate">{subj}</span>
                    </div>
                    <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px] text-zinc-500 font-mono">({subjCount})</span>
                  </div>

                  {isSubjExpanded && (
                    <div className="pl-4 space-y-1">
                      {["Class 11", "Class 12"].map((cls) => {
                        const clsId = `${subj}-${cls}`;
                        const clsCount = getCount(subj, cls);
                        const isClsExpanded = expandedNodes.includes(clsId);
                        const qClsVal = cls === 'Class 11' ? '11th' : '12th';
                        const isClsSelected = subjectFilter === subj && classFilter === qClsVal && topicFilter === 'All';

                        return (
                          <div key={cls} className="space-y-1">
                            <div
                              onClick={() => {
                                toggleNode(clsId);
                                setHierarchyFilters(subj, cls);
                              }}
                              className={`flex items-center justify-between p-1.5 rounded cursor-pointer transition ${
                                isClsSelected ? 'bg-brand-gold/10 text-brand-gold font-semibold' : 'text-zinc-400 hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-1 min-w-0">
                                {isClsExpanded ? <ChevronDown className="w-3 h-3 shrink-0" /> : <ChevronRight className="w-3 h-3 shrink-0" />}
                                <span>{cls}</span>
                              </div>
                              <span className="text-[9px] text-zinc-600 font-mono">({clsCount})</span>
                            </div>

                            {isClsExpanded && (
                              <div className="pl-4 space-y-1 border-l border-zinc-800">
                                {ACADEMIC_HIERARCHY[subj][cls].map((chap) => {
                                  const chapId = `${subj}-${cls}-${chap.name}`;
                                  const chapCount = getCount(subj, cls, chap.name);
                                  const isChapExpanded = expandedNodes.includes(chapId);
                                  const isChapSelected = subjectFilter === subj && classFilter === qClsVal && topicFilter === chap.name && conceptFilter === 'All';

                                  return (
                                    <div key={chap.name} className="space-y-1">
                                      <div
                                        onClick={() => {
                                          toggleNode(chapId);
                                          setHierarchyFilters(subj, cls, chap.name);
                                        }}
                                        className={`flex items-center justify-between p-1 rounded cursor-pointer transition ${
                                          isChapSelected ? 'bg-zinc-850 text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
                                        }`}
                                      >
                                        <div className="flex items-center gap-1 min-w-0">
                                          {isChapExpanded ? <ChevronDown className="w-2.5 h-2.5 shrink-0" /> : <ChevronRight className="w-2.5 h-2.5 shrink-0" />}
                                          <span className="truncate">{chap.name}</span>
                                        </div>
                                        <span className="text-[8px] text-zinc-600 font-mono">({chapCount})</span>
                                      </div>

                                      {isChapExpanded && (
                                        <div className="pl-3 space-y-1 border-l border-zinc-900">
                                          {chap.concepts.map((conc) => {
                                            const concId = `${subj}-${cls}-${chap.name}-${conc.name}`;
                                            const concCount = getCount(subj, cls, chap.name, conc.name);
                                            const isConcExpanded = expandedNodes.includes(concId);
                                            const isConcSelected = subjectFilter === subj && classFilter === qClsVal && topicFilter === chap.name && conceptFilter === conc.name && subConceptFilter === 'All';

                                            return (
                                              <div key={conc.name} className="space-y-1">
                                                <div
                                                  onClick={() => {
                                                    toggleNode(concId);
                                                    setHierarchyFilters(subj, cls, chap.name, conc.name);
                                                  }}
                                                  className={`flex items-center justify-between p-0.5 rounded cursor-pointer transition text-[10px] ${
                                                    isConcSelected ? 'text-brand-gold font-medium' : 'text-zinc-600 hover:text-zinc-400'
                                                  }`}
                                                >
                                                  <div className="flex items-center gap-1 min-w-0">
                                                    {isConcExpanded ? <ChevronDown className="w-2 h-2 shrink-0" /> : <ChevronRight className="w-2 h-2 shrink-0" />}
                                                    <span className="truncate">{conc.name}</span>
                                                  </div>
                                                  <span className="text-[8px] text-zinc-700 font-mono">({concCount})</span>
                                                </div>

                                                {isConcExpanded && (
                                                  <div className="pl-3 space-y-0.5 border-l border-zinc-950">
                                                    {conc.subConcepts.length === 0 ? (
                                                      // If there are no sub-concepts, render question types directly
                                                      [
                                                        { code: 'MCQ', label: 'MCQ' },
                                                        { code: 'ASSERTION_REASON', label: 'Assertion & Reason' },
                                                        { code: 'STATEMENT_BASED', label: 'Statement Based' },
                                                        { code: 'TRUE_FALSE', label: 'True / False' },
                                                        { code: 'MATCH_THE_FOLLOWING', label: 'Match the Following' },
                                                        { code: 'NUMERICAL', label: 'Numerical' },
                                                        { code: 'DIAGRAM', label: 'Diagram Based' }
                                                      ].map((qt) => {
                                                        const qtCount = getCount(subj, cls, chap.name, conc.name, undefined, qt.code);
                                                        const isQtSelected = subjectFilter === subj && classFilter === qClsVal && topicFilter === chap.name && conceptFilter === conc.name && subConceptFilter === 'All' && questionTypeFilter === qt.code;
                                                        return (
                                                          <div
                                                            key={qt.code}
                                                            onClick={() => setHierarchyFilters(subj, cls, chap.name, conc.name, undefined, qt.code)}
                                                            className={`flex items-center justify-between py-0.5 px-1 rounded cursor-pointer transition text-[9px] ${
                                                              isQtSelected ? 'text-brand-gold font-bold bg-white/5' : 'text-zinc-700 hover:text-zinc-500'
                                                            }`}
                                                          >
                                                            <span className="truncate">{qt.label}</span>
                                                            <span className="text-[8px] text-zinc-800 font-mono">({qtCount})</span>
                                                          </div>
                                                        );
                                                      })
                                                    ) : (
                                                      // Render sub-concepts
                                                      conc.subConcepts.map((subc) => {
                                                        const subcId = `${subj}-${cls}-${chap.name}-${conc.name}-${subc}`;
                                                        const subcCount = getCount(subj, cls, chap.name, conc.name, subc);
                                                        const isSubcExpanded = expandedNodes.includes(subcId);
                                                        const isSubcSelected = subjectFilter === subj && classFilter === qClsVal && topicFilter === chap.name && conceptFilter === conc.name && subConceptFilter === subc && questionTypeFilter === 'All';

                                                        return (
                                                          <div key={subc} className="space-y-1">
                                                            <div
                                                              onClick={() => {
                                                                toggleNode(subcId);
                                                                setHierarchyFilters(subj, cls, chap.name, conc.name, subc);
                                                              }}
                                                              className={`flex items-center justify-between py-0.5 px-1 rounded cursor-pointer transition text-[9px] ${
                                                                isSubcSelected ? 'text-white font-bold bg-white/5' : 'text-zinc-700 hover:text-zinc-500'
                                                              }`}
                                                            >
                                                              <div className="flex items-center gap-1 min-w-0">
                                                                {isSubcExpanded ? <ChevronDown className="w-1.5 h-1.5 shrink-0" /> : <ChevronRight className="w-1.5 h-1.5 shrink-0" />}
                                                                <span className="truncate">{subc}</span>
                                                              </div>
                                                              <span className="text-[8px] text-zinc-800 font-mono">({subcCount})</span>
                                                            </div>

                                                            {isSubcExpanded && (
                                                              <div className="pl-3 space-y-0.5 border-l border-zinc-900">
                                                                {[
                                                                  { code: 'MCQ', label: 'MCQ' },
                                                                  { code: 'ASSERTION_REASON', label: 'Assertion & Reason' },
                                                                  { code: 'STATEMENT_BASED', label: 'Statement Based' },
                                                                  { code: 'TRUE_FALSE', label: 'True / False' },
                                                                  { code: 'MATCH_THE_FOLLOWING', label: 'Match the Following' },
                                                                  { code: 'NUMERICAL', label: 'Numerical' },
                                                                  { code: 'DIAGRAM', label: 'Diagram Based' }
                                                                ].map((qt) => {
                                                                  const qtCount = getCount(subj, cls, chap.name, conc.name, subc, qt.code);
                                                                  const isQtSelected = subjectFilter === subj && classFilter === qClsVal && topicFilter === chap.name && conceptFilter === conc.name && subConceptFilter === subc && questionTypeFilter === qt.code;
                                                                  return (
                                                                    <div
                                                                      key={qt.code}
                                                                      onClick={() => setHierarchyFilters(subj, cls, chap.name, conc.name, subc, qt.code)}
                                                                      className={`flex items-center justify-between py-0.5 px-1 rounded cursor-pointer transition text-[9px] ${
                                                                        isQtSelected ? 'text-brand-gold font-bold bg-white/5' : 'text-zinc-700 hover:text-zinc-500'
                                                                      }`}
                                                                    >
                                                                      <span className="truncate">{qt.label}</span>
                                                                      <span className="text-[8px] text-zinc-800 font-mono">({qtCount})</span>
                                                                    </div>
                                                                  );
                                                                })}
                                                              </div>
                                                            )}
                                                          </div>
                                                        );
                                                      })
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Questions list */}
        <div className="lg:col-span-3 space-y-6">
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
                      <div>Chapter: <span className="text-zinc-300 font-medium">{q.topic}</span></div>
                      <div>Concept: <span className="text-zinc-300 font-medium">{q.concept}</span></div>
                      <div>Sub-Concept: <span className="text-zinc-300 font-medium">{q.subConcept || 'N/A'}</span></div>
                      <div>Class: <span className="text-zinc-300 font-medium">{q.classVal}</span></div>
                      <div>Exam: <span className="text-zinc-300 font-medium">{q.examType}</span></div>
                      <div>Type: <span className="text-brand-gold font-bold">{q.questionType || 'MCQ'}</span></div>
                      <div className="col-span-2">Author: <span className="text-zinc-300 font-medium">{q.intern.name} (Roll {q.intern.rollNo})</span></div>
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
                  No questions found matching the selected NCERT criteria
                </div>
              )}
            </div>
          )}
        </div>

      </div>

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
                  <p className="text-[10px] text-brand-muted uppercase font-bold">Question Type</p>
                  <p className="text-sm font-semibold text-brand-gold mt-0.5">{(selectedQuestion as any).questionType || 'MCQ'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs text-brand-muted border-b border-brand-border pb-4">
                <div>Topic: <span className="text-zinc-300 font-medium">{selectedQuestion.topic}</span></div>
                <div>Concept: <span className="text-zinc-300 font-medium">{selectedQuestion.concept}</span></div>
                <div>Sub Concept: <span className="text-zinc-300 font-medium">{selectedQuestion.subConcept || 'N/A'}</span></div>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-bold tracking-wider text-brand-gold">
                  {((selectedQuestion as any).questionType === 'TRUE_FALSE') ? 'Statement' : 'Question Text'}
                </h4>
                <div className="p-4 bg-zinc-950/60 rounded-xl border border-brand-border text-white text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedQuestion.questionText}
                </div>
              </div>

              {/* Question Images if any */}
              {selectedQuestion.images && selectedQuestion.images.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-brand-gold">Attached Images</h4>
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

              {/* Match Column Grid */}
              {((selectedQuestion as any).questionType === 'MATCH_THE_FOLLOWING' && (selectedQuestion as any).extraData) && (
                <div className="p-4 bg-zinc-950/60 border border-brand-border rounded-xl space-y-3">
                  <h5 className="text-xs font-bold text-brand-gold uppercase tracking-wider">Columns Match Grid</h5>
                  <div className="grid grid-cols-2 gap-8 text-sm">
                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-400 pb-1 border-b border-brand-border/20">Column A</p>
                      {(((selectedQuestion as any).extraData as any).matchColumnA || []).map((item: string, idx: number) => (
                        <div key={idx} className="text-white py-1">{idx + 1}. {item}</div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-zinc-400 pb-1 border-b border-brand-border/20">Column B</p>
                      {(((selectedQuestion as any).extraData as any).matchColumnB || []).map((item: string, idx: number) => (
                        <div key={idx} className="text-white py-1">{String.fromCharCode(65 + idx)}. {item}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Options Dynamic rendering based on type */}
              {((selectedQuestion as any).questionType === 'NUMERICAL') ? (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/50 rounded-xl flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">Correct Numerical Answer:</span>
                  <span className="font-mono text-lg font-bold text-emerald-400 bg-black/60 px-4 py-1.5 rounded-lg border border-brand-border">{selectedQuestion.correctAnswer}</span>
                </div>
              ) : ((selectedQuestion as any).questionType === 'TRUE_FALSE') ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { opt: 'A', label: "True" },
                    { opt: 'B', label: "False" }
                  ].map(({ opt, label }) => (
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
                        {opt === 'A' ? 'T' : 'F'}
                      </span>
                      <div className="whitespace-pre-wrap">{label}</div>
                    </div>
                  ))}
                </div>
              ) : ((selectedQuestion as any).questionType === 'ASSERTION_REASON') ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { opt: 'A', label: "A and R are true and R is the correct explanation." },
                    { opt: 'B', label: "A and R are true but R is not the correct explanation." },
                    { opt: 'C', label: "A is true but R is false." },
                    { opt: 'D', label: "A is false but R is true." }
                  ].map(({ opt, label }) => (
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
                      <div className="whitespace-pre-wrap">{label}</div>
                    </div>
                  ))}
                </div>
              ) : (
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
              )}

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
                    className="w-full px-4 py-2.5 rounded-lg border border-brand-border bg-black text-white focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition duration-200 text-sm"
                    placeholder="Provide correction details or rejection explanation..."
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleReview(selectedQuestion.id, 'APPROVED')}
                    disabled={updating}
                    className="flex-1 py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-sm transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 border-0"
                  >
                    <Check className="w-5 h-5" />
                    <span>Approve & Award Points</span>
                  </button>
                  <button
                    onClick={() => handleReview(selectedQuestion.id, 'CORRECTION_REQUESTED')}
                    disabled={updating}
                    className="flex-1 py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-semibold text-sm transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 border-0"
                  >
                    <AlertCircle className="w-5 h-5" />
                    <span>Request Correction</span>
                  </button>
                  <button
                    onClick={() => handleReview(selectedQuestion.id, 'REJECTED')}
                    disabled={updating}
                    className="flex-1 py-2 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 border-0"
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
