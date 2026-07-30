'use client';

import React, { useState, useRef } from 'react';
import { detectContentFormat } from '@/lib/engine/contentDetector';
import { detectSubjectCategory } from '@/lib/engine/subjectDetector';
import { parseContentBySubject } from '@/lib/engine/subjectParsers';
import { splitQuestionBlock } from '@/lib/engine/questionSplitter';
import { validateQuestionPayload, ValidationReport } from '@/lib/engine/validationEngine';
import StudentPreviewRenderer from '@/components/StudentPreviewRenderer';

interface RichQuestionEditorProps {
  initialContent?: string;
  onSave?: (data: any) => void;
  className?: string;
}

export default function RichQuestionEditor({
  initialContent = '',
  onSave,
  className = ''
}: RichQuestionEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [detectedSubject, setDetectedSubject] = useState('PHYSICS');
  const [detectedFormat, setDetectedFormat] = useState('PLAIN_TEXT');
  const [activeTab, setActiveTab] = useState<'AUTHOR' | 'SPLIT_BLOCKS' | 'STUDENT_PREVIEW'>('AUTHOR');
  const [validationReport, setValidationReport] = useState<ValidationReport>({ isValid: true, errors: [], warnings: [] });

  const [questionText, setQuestionText] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [detailedSolution, setDetailedSolution] = useState('');

  const editorRef = useRef<HTMLDivElement>(null);

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const htmlData = e.clipboardData.getData('text/html');
    const textData = e.clipboardData.getData('text/plain');

    const rawPayload = htmlData || textData;
    const detection = detectContentFormat(rawPayload);
    setDetectedFormat(detection.format);

    const subjResult = detectSubjectCategory(rawPayload);
    setDetectedSubject(subjResult.primarySubject);

    // Run Question Splitter AST
    const splitted = splitQuestionBlock(textData || htmlData);
    if (splitted.questionText) {
      setQuestionText(splitted.questionText);
      setOptionA(splitted.optionA);
      setOptionB(splitted.optionB);
      setOptionC(splitted.optionC);
      setOptionD(splitted.optionD);
      setCorrectAnswer(splitted.correctAnswer);
      setDetailedSolution(splitted.detailedSolution);
    }

    // Run Validation Engine
    const report = validateQuestionPayload({
      questionText: splitted.questionText || rawPayload,
      optionA: splitted.optionA,
      optionB: splitted.optionB,
      optionC: splitted.optionC,
      optionD: splitted.optionD,
      correctAnswer: splitted.correctAnswer,
      detailedSolution: splitted.detailedSolution,
    });
    setValidationReport(report);
  };

  const handleAutoProcess = () => {
    const currentVal = editorRef.current?.innerText || content;
    const parsed = parseContentBySubject(currentVal, detectedSubject);
    setContent(parsed.renderedText);

    const splitted = splitQuestionBlock(currentVal);
    setQuestionText(splitted.questionText || parsed.renderedText);
    setOptionA(splitted.optionA);
    setOptionB(splitted.optionB);
    setOptionC(splitted.optionC);
    setOptionD(splitted.optionD);
    setCorrectAnswer(splitted.correctAnswer);
    setDetailedSolution(splitted.detailedSolution);

    const report = validateQuestionPayload({
      questionText: splitted.questionText || parsed.renderedText,
      optionA: splitted.optionA,
      optionB: splitted.optionB,
      optionC: splitted.optionC,
      optionD: splitted.optionD,
      correctAnswer: splitted.correctAnswer,
      detailedSolution: splitted.detailedSolution,
    });
    setValidationReport(report);
  };

  return (
    <div className={`rich-question-editor bg-zinc-950 border border-brand-border rounded-xl p-4 space-y-4 shadow-xl ${className}`}>
      {/* Engine Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-brand-border/40 pb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-extrabold text-brand-gold uppercase tracking-wider">
            AST Modular Engine Active
          </span>
          <span className="bg-zinc-900 text-zinc-300 px-2.5 py-0.5 rounded border border-brand-border font-mono text-[10px]">
            Format: {detectedFormat}
          </span>
          <span className="bg-brand-gold/15 text-brand-gold px-2.5 py-0.5 rounded border border-brand-gold/30 font-bold text-[10px]">
            Subject: {detectedSubject}
          </span>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-brand-border/40">
          <button
            type="button"
            onClick={() => setActiveTab('AUTHOR')}
            className={`px-3 py-1 font-bold rounded transition cursor-pointer ${
              activeTab === 'AUTHOR' ? 'bg-brand-gold text-zinc-950 shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            ✏️ Rich Authoring Workspace
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('SPLIT_BLOCKS')}
            className={`px-3 py-1 font-bold rounded transition cursor-pointer ${
              activeTab === 'SPLIT_BLOCKS' ? 'bg-brand-gold text-zinc-950 shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            🧩 Split Fields (Q & A-D)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('STUDENT_PREVIEW')}
            className={`px-3 py-1 font-bold rounded transition cursor-pointer ${
              activeTab === 'STUDENT_PREVIEW' ? 'bg-brand-gold text-zinc-950 shadow' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            👁️ 1:1 Official Student View
          </button>
        </div>
      </div>

      {/* Diagnostics & Validation Bar */}
      {validationReport.warnings.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/40 text-amber-200 p-2.5 rounded-lg text-xs space-y-1">
          <span className="font-bold uppercase block text-amber-400">Diagnostic Warnings ({validationReport.warnings.length}):</span>
          {validationReport.warnings.map((w, idx) => (
            <p key={idx} className="text-[11px]">• [{w.code}] {w.message}</p>
          ))}
        </div>
      )}

      {/* AUTHOR TAB */}
      {activeTab === 'AUTHOR' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-brand-gold uppercase tracking-wider">
              Paste MS Word, Google Docs, LaTeX, or Plain Text
            </label>
            <button
              type="button"
              onClick={handleAutoProcess}
              className="px-3 py-1 bg-brand-gold hover:bg-brand-gold-hover text-zinc-950 font-black text-xs uppercase tracking-wider rounded transition cursor-pointer shadow"
            >
              ⚡ Run Full AST Pipeline
            </button>
          </div>

          <div
            ref={editorRef}
            contentEditable
            onPaste={handlePaste}
            onInput={() => setContent(editorRef.current?.innerText || '')}
            className="w-full bg-zinc-900 text-zinc-100 border border-brand-border rounded-xl p-4 min-h-[220px] focus:outline-none focus:border-brand-gold font-sans text-sm leading-relaxed overflow-y-auto"
          />
        </div>
      )}

      {/* SPLIT BLOCKS TAB */}
      {activeTab === 'SPLIT_BLOCKS' && (
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-brand-gold uppercase mb-1">Question Text</label>
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              rows={4}
              className="w-full bg-zinc-900 text-zinc-100 border border-brand-border rounded p-3 text-xs font-mono focus:border-brand-gold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">(1) Option A</label>
              <input
                type="text"
                value={optionA}
                onChange={(e) => setOptionA(e.target.value)}
                className="w-full bg-zinc-900 text-zinc-100 border border-brand-border/60 rounded p-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">(2) Option B</label>
              <input
                type="text"
                value={optionB}
                onChange={(e) => setOptionB(e.target.value)}
                className="w-full bg-zinc-900 text-zinc-100 border border-brand-border/60 rounded p-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">(3) Option C</label>
              <input
                type="text"
                value={optionC}
                onChange={(e) => setOptionC(e.target.value)}
                className="w-full bg-zinc-900 text-zinc-100 border border-brand-border/60 rounded p-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase mb-1">(4) Option D</label>
              <input
                type="text"
                value={optionD}
                onChange={(e) => setOptionD(e.target.value)}
                className="w-full bg-zinc-900 text-zinc-100 border border-brand-border/60 rounded p-2 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-emerald-400 uppercase mb-1">Detailed Solution</label>
            <textarea
              value={detailedSolution}
              onChange={(e) => setDetailedSolution(e.target.value)}
              rows={3}
              className="w-full bg-zinc-900 text-zinc-100 border border-brand-border rounded p-3 text-xs font-mono"
            />
          </div>
        </div>
      )}

      {/* STUDENT PREVIEW TAB */}
      {activeTab === 'STUDENT_PREVIEW' && (
        <StudentPreviewRenderer
          questionText={questionText || content}
          optionA={optionA}
          optionB={optionB}
          optionC={optionC}
          optionD={optionD}
          detailedSolution={detailedSolution}
          subject={detectedSubject}
        />
      )}
    </div>
  );
}
