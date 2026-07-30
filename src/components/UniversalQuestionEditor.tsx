'use client';

import React, { useState, useRef, useEffect } from 'react';
import QuestionRenderer from '@/components/QuestionRenderer';
import MathToolbar from '@/components/MathToolbar';
import { formatCleanText, handleRichPaste } from '@/lib/pasteUtils';
import { normalizePostProcessing } from '@/lib/mathParser';

interface UniversalQuestionEditorProps {
  questionText: string;
  onChangeQuestionText: (text: string) => void;
  optionA?: string;
  onChangeOptionA?: (text: string) => void;
  optionB?: string;
  onChangeOptionB?: (text: string) => void;
  optionC?: string;
  onChangeOptionC?: (text: string) => void;
  optionD?: string;
  onChangeOptionD?: (text: string) => void;
  detailedSolution?: string;
  onChangeDetailedSolution?: (text: string) => void;
  subject?: string;
  onChangeSubject?: (subj: string) => void;
  className?: string;
}

export default function UniversalQuestionEditor({
  questionText,
  onChangeQuestionText,
  optionA = '',
  onChangeOptionA,
  optionB = '',
  onChangeOptionB,
  optionC = '',
  onChangeOptionC,
  optionD = '',
  onChangeOptionD,
  detailedSolution = '',
  onChangeDetailedSolution,
  subject = 'Physics',
  onChangeSubject,
  className = ''
}: UniversalQuestionEditorProps) {
  const [activeTab, setActiveTab] = useState<'EDIT' | 'PREVIEW'>('EDIT');
  const [activeSubject, setActiveSubject] = useState<string>(subject);
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const solutionTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (subject) setActiveSubject(subject);
  }, [subject]);

  const handleSubjectChange = (newSubj: string) => {
    setActiveSubject(newSubj);
    if (onChangeSubject) onChangeSubject(newSubj);
  };

  const handleAutoFormatAll = () => {
    const cleanQ = normalizePostProcessing(formatCleanText(questionText));
    onChangeQuestionText(cleanQ);

    if (onChangeOptionA && optionA) onChangeOptionA(formatCleanText(optionA));
    if (onChangeOptionB && optionB) onChangeOptionB(formatCleanText(optionB));
    if (onChangeOptionC && optionC) onChangeOptionC(formatCleanText(optionC));
    if (onChangeOptionD && optionD) onChangeOptionD(formatCleanText(optionD));
    if (onChangeDetailedSolution && detailedSolution) {
      onChangeDetailedSolution(normalizePostProcessing(formatCleanText(detailedSolution)));
    }
  };

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Botany', 'Zoology'];

  return (
    <div className={`universal-question-editor bg-zinc-950 border border-brand-border/60 rounded-xl p-4 space-y-4 shadow-xl ${className}`}>
      {/* Header & Subject Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border/40 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-gold animate-pulse" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-brand-gold">
            Universal Question Editor
          </h3>
          <span className="text-[10px] bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded border border-brand-gold/30 font-semibold">
            MS Word • LaTeX • Multi-Subject
          </span>
        </div>

        {/* Subject Pills */}
        <div className="flex flex-wrap items-center gap-1 bg-zinc-900/80 p-1 rounded-lg border border-brand-border/50">
          {subjects.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => handleSubjectChange(s)}
              className={`px-2.5 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                activeSubject === s
                  ? 'bg-brand-gold text-zinc-950 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Preview Toggle Tabs */}
      <div className="flex items-center justify-between gap-2 bg-zinc-900 p-1 rounded-lg border border-brand-border/40">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('EDIT')}
            className={`px-4 py-1.5 text-xs font-extrabold rounded-md uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'EDIT'
                ? 'bg-brand-gold/20 text-brand-gold border border-brand-gold/40'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ✏️ Question Input Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('PREVIEW')}
            className={`px-4 py-1.5 text-xs font-extrabold rounded-md uppercase tracking-wider transition cursor-pointer ${
              activeTab === 'PREVIEW'
                ? 'bg-brand-gold text-zinc-950 shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            👁️ 1:1 Live Student Preview
          </button>
        </div>

        {/* Global Auto-Format Button */}
        <button
          type="button"
          onClick={handleAutoFormatAll}
          className="px-3 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-zinc-950 font-black text-xs uppercase tracking-wider rounded shadow transition cursor-pointer flex items-center gap-1.5"
          title="Auto-detect MS Word HTML, LaTeX, Chemistry Charges, Physics Vectors, and Botany Scientific Names"
        >
          <span>⚡ Auto-Format All Fields</span>
        </button>
      </div>

      {/* EDIT MODE */}
      {activeTab === 'EDIT' && (
        <div className="space-y-4">
          {/* Formatting Toolbar */}
          <MathToolbar
            targetRef={questionTextareaRef}
            currentValue={questionText}
            onUpdate={onChangeQuestionText}
          />

          {/* Main Question Textarea */}
          <div className="space-y-1">
            <label className="block text-xs font-extrabold text-brand-gold uppercase tracking-wider">
              Question Text (Supports Word Paste, LaTeX, & Unicode Formulas) *
            </label>
            <textarea
              ref={questionTextareaRef}
              value={questionText}
              onChange={e => onChangeQuestionText(e.target.value)}
              onPaste={e => handleRichPaste(e, questionText, onChangeQuestionText)}
              rows={5}
              className="w-full bg-zinc-900 text-zinc-100 border border-brand-border/80 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition shadow-inner"
              placeholder="Paste content from MS Word, LaTeX ($...$), or plain text here. Formulas, superscripts, subscripts, and images will be preserved..."
            />
          </div>

          {/* Options Inputs (if provided) */}
          {(onChangeOptionA || onChangeOptionB || onChangeOptionC || onChangeOptionD) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {onChangeOptionA && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">(1) Option A</label>
                  <input
                    type="text"
                    value={optionA}
                    onChange={e => onChangeOptionA(e.target.value)}
                    onPaste={e => handleRichPaste(e, optionA, onChangeOptionA)}
                    className="w-full bg-zinc-900 text-zinc-100 border border-brand-border/60 rounded p-2 text-xs font-mono focus:border-brand-gold focus:outline-none"
                    placeholder="Option A content..."
                  />
                </div>
              )}
              {onChangeOptionB && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">(2) Option B</label>
                  <input
                    type="text"
                    value={optionB}
                    onChange={e => onChangeOptionB(e.target.value)}
                    onPaste={e => handleRichPaste(e, optionB, onChangeOptionB)}
                    className="w-full bg-zinc-900 text-zinc-100 border border-brand-border/60 rounded p-2 text-xs font-mono focus:border-brand-gold focus:outline-none"
                    placeholder="Option B content..."
                  />
                </div>
              )}
              {onChangeOptionC && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">(3) Option C</label>
                  <input
                    type="text"
                    value={optionC}
                    onChange={e => onChangeOptionC(e.target.value)}
                    onPaste={e => handleRichPaste(e, optionC, onChangeOptionC)}
                    className="w-full bg-zinc-900 text-zinc-100 border border-brand-border/60 rounded p-2 text-xs font-mono focus:border-brand-gold focus:outline-none"
                    placeholder="Option C content..."
                  />
                </div>
              )}
              {onChangeOptionD && (
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">(4) Option D</label>
                  <input
                    type="text"
                    value={optionD}
                    onChange={e => onChangeOptionD(e.target.value)}
                    onPaste={e => handleRichPaste(e, optionD, onChangeOptionD)}
                    className="w-full bg-zinc-900 text-zinc-100 border border-brand-border/60 rounded p-2 text-xs font-mono focus:border-brand-gold focus:outline-none"
                    placeholder="Option D content..."
                  />
                </div>
              )}
            </div>
          )}

          {/* Solution Textarea (if provided) */}
          {onChangeDetailedSolution && (
            <div className="space-y-1 pt-2">
              <label className="block text-xs font-extrabold text-brand-gold uppercase tracking-wider">
                Detailed Solution & Explanation
              </label>
              <textarea
                ref={solutionTextareaRef}
                value={detailedSolution}
                onChange={e => onChangeDetailedSolution(e.target.value)}
                onPaste={e => handleRichPaste(e, detailedSolution, onChangeDetailedSolution)}
                rows={4}
                className="w-full bg-zinc-900 text-zinc-100 border border-brand-border/80 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-brand-gold"
                placeholder="Step-by-step mathematical or chemical explanation..."
              />
            </div>
          )}
        </div>
      )}

      {/* PREVIEW MODE (1:1 Student Exam View) */}
      {(activeTab === 'PREVIEW' || questionText) && (
        <div className="space-y-3 bg-zinc-900/90 border border-brand-border/80 rounded-xl p-4 shadow-inner">
          <div className="flex items-center justify-between border-b border-brand-border/40 pb-2">
            <span className="text-xs font-black uppercase text-brand-gold tracking-widest flex items-center gap-1.5">
              <span>✨ 1:1 Live Student Exam View</span>
              <span className="text-[10px] text-zinc-400 font-normal">({activeSubject})</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/40">
              ● Publication Quality (Mathpix / MS Word)
            </span>
          </div>

          {/* Question Text Rendered */}
          <div className="text-zinc-100 text-sm font-sans leading-relaxed">
            <QuestionRenderer text={questionText} subject={activeSubject} />
          </div>

          {/* Options Rendered */}
          {(optionA || optionB || optionC || optionD) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-brand-border/30">
              {optionA && (
                <div className="flex items-start gap-2 bg-zinc-950/80 p-2.5 rounded border border-brand-border/40 text-xs">
                  <span className="font-bold text-brand-gold shrink-0">(1)</span>
                  <QuestionRenderer text={optionA} subject={activeSubject} inline />
                </div>
              )}
              {optionB && (
                <div className="flex items-start gap-2 bg-zinc-950/80 p-2.5 rounded border border-brand-border/40 text-xs">
                  <span className="font-bold text-brand-gold shrink-0">(2)</span>
                  <QuestionRenderer text={optionB} subject={activeSubject} inline />
                </div>
              )}
              {optionC && (
                <div className="flex items-start gap-2 bg-zinc-950/80 p-2.5 rounded border border-brand-border/40 text-xs">
                  <span className="font-bold text-brand-gold shrink-0">(3)</span>
                  <QuestionRenderer text={optionC} subject={activeSubject} inline />
                </div>
              )}
              {optionD && (
                <div className="flex items-start gap-2 bg-zinc-950/80 p-2.5 rounded border border-brand-border/40 text-xs">
                  <span className="font-bold text-brand-gold shrink-0">(4)</span>
                  <QuestionRenderer text={optionD} subject={activeSubject} inline />
                </div>
              )}
            </div>
          )}

          {/* Detailed Solution Rendered */}
          {detailedSolution && (
            <div className="mt-3 pt-3 border-t border-brand-border/40 bg-zinc-950/90 p-3 rounded-lg border border-brand-border/50 space-y-1">
              <span className="text-xs font-bold text-brand-gold uppercase block">Detailed Solution:</span>
              <div className="text-zinc-200 text-xs font-sans leading-relaxed">
                <QuestionRenderer text={detailedSolution} subject={activeSubject} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
