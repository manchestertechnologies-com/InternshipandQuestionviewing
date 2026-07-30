'use client';

import React from 'react';
import MathRenderer from '@/components/MathRenderer';

interface StudentPreviewRendererProps {
  questionText: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  detailedSolution?: string;
  subject?: string;
  className?: string;
}

export default function StudentPreviewRenderer({
  questionText,
  optionA = '',
  optionB = '',
  optionC = '',
  optionD = '',
  detailedSolution = '',
  subject = 'PHYSICS',
  className = ''
}: StudentPreviewRendererProps) {
  return (
    <div className={`student-preview-renderer bg-zinc-900/90 border border-brand-border/80 rounded-xl p-5 shadow-2xl space-y-4 ${className}`}>
      {/* Official Exam Header Bar */}
      <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h4 className="font-extrabold text-xs uppercase tracking-widest text-brand-gold">
            Official Student Exam View (1:1 Pixel Match)
          </h4>
        </div>
        <span className="text-[10px] font-bold bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded border border-brand-border/50">
          Subject: {subject}
        </span>
      </div>

      {/* Main Question Card */}
      <div className="bg-zinc-950/80 border border-brand-border/60 rounded-lg p-4 space-y-3">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Question:</span>
        <div className="text-zinc-100 text-sm font-sans leading-relaxed">
          <MathRenderer text={questionText} />
        </div>
      </div>

      {/* Options Cards */}
      {(optionA || optionB || optionC || optionD) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
          {optionA && (
            <div className="flex items-start gap-2.5 bg-zinc-950/70 p-3 rounded-lg border border-brand-border/40 text-xs hover:border-brand-gold/40 transition">
              <span className="w-5 h-5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 flex items-center justify-center font-bold text-[10px] shrink-0">
                1
              </span>
              <div className="text-zinc-200">
                <MathRenderer text={optionA} inline />
              </div>
            </div>
          )}

          {optionB && (
            <div className="flex items-start gap-2.5 bg-zinc-950/70 p-3 rounded-lg border border-brand-border/40 text-xs hover:border-brand-gold/40 transition">
              <span className="w-5 h-5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 flex items-center justify-center font-bold text-[10px] shrink-0">
                2
              </span>
              <div className="text-zinc-200">
                <MathRenderer text={optionB} inline />
              </div>
            </div>
          )}

          {optionC && (
            <div className="flex items-start gap-2.5 bg-zinc-950/70 p-3 rounded-lg border border-brand-border/40 text-xs hover:border-brand-gold/40 transition">
              <span className="w-5 h-5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 flex items-center justify-center font-bold text-[10px] shrink-0">
                3
              </span>
              <div className="text-zinc-200">
                <MathRenderer text={optionC} inline />
              </div>
            </div>
          )}

          {optionD && (
            <div className="flex items-start gap-2.5 bg-zinc-950/70 p-3 rounded-lg border border-brand-border/40 text-xs hover:border-brand-gold/40 transition">
              <span className="w-5 h-5 rounded-full bg-brand-gold/15 text-brand-gold border border-brand-gold/30 flex items-center justify-center font-bold text-[10px] shrink-0">
                4
              </span>
              <div className="text-zinc-200">
                <MathRenderer text={optionD} inline />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Solution */}
      {detailedSolution && (
        <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-lg p-4 space-y-1.5 mt-2">
          <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">
            Step-by-Step Solution:
          </span>
          <div className="text-zinc-200 text-xs font-sans leading-relaxed">
            <MathRenderer text={detailedSolution} />
          </div>
        </div>
      )}
    </div>
  );
}
