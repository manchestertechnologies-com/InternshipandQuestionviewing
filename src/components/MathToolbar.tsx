'use client';

import React from 'react';
import { convertToSubscript, convertToSuperscript, formatCleanText, insertTextAtCursor } from '@/lib/pasteUtils';

interface MathToolbarProps {
  targetRef?: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
  currentValue: string;
  onUpdate: (newValue: string) => void;
  className?: string;
}

export default function MathToolbar({ targetRef, currentValue, onUpdate, className = '' }: MathToolbarProps) {
  const insertOrFormat = (actionType: 'SUB' | 'SUPER' | 'SYMBOL' | 'CHEM_AUTO', symbolValue?: string) => {
    const el = targetRef?.current;
    if (!el) {
      if (actionType === 'CHEM_AUTO') {
        onUpdate(formatCleanText(currentValue));
      } else if (symbolValue) {
        onUpdate(currentValue + symbolValue);
      }
      return;
    }

    const start = el.selectionStart ?? currentValue.length;
    const end = el.selectionEnd ?? currentValue.length;
    const selectedText = currentValue.substring(start, end);

    if (actionType === 'CHEM_AUTO') {
      if (selectedText) {
        const formatted = formatCleanText(selectedText);
        insertTextAtCursor(el, formatted, currentValue, onUpdate);
      } else {
        const formatted = formatCleanText(currentValue);
        onUpdate(formatted);
      }
    } else if (actionType === 'SUB') {
      const formatted = selectedText ? convertToSubscript(selectedText) : '₂';
      insertTextAtCursor(el, formatted, currentValue, onUpdate);
    } else if (actionType === 'SUPER') {
      const formatted = selectedText ? convertToSuperscript(selectedText) : '²';
      insertTextAtCursor(el, formatted, currentValue, onUpdate);
    } else if (actionType === 'SYMBOL' && symbolValue) {
      insertTextAtCursor(el, symbolValue, currentValue, onUpdate);
    }
  };

  const symbols = [
    { label: '±', val: '±', title: 'Plus-Minus' },
    { label: '√', val: '√', title: 'Square Root' },
    { label: 'π', val: 'π', title: 'Pi' },
    { label: 'θ', val: 'θ', title: 'Theta' },
    { label: 'α', val: 'α', title: 'Alpha' },
    { label: 'β', val: 'β', title: 'Beta' },
    { label: 'Δ', val: 'Δ', title: 'Delta' },
    { label: '°', val: '°', title: 'Degree' },
    { label: '→', val: '→', title: 'Right Arrow' },
    { label: '≤', val: '≤', title: 'Less or Equal' },
    { label: '≥', val: '≥', title: 'Greater or Equal' },
    { label: '≠', val: '≠', title: 'Not Equal' },
    { label: '∞', val: '∞', title: 'Infinity' },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-1 bg-zinc-950 p-1.5 rounded-lg border border-brand-border/60 ${className}`}>
      <span className="text-[9px] font-extrabold uppercase text-brand-gold tracking-wider mr-1 select-none">
        Format:
      </span>
      
      {/* Auto Chemical & Math Formatter Button */}
      <button
        type="button"
        onClick={() => insertOrFormat('CHEM_AUTO')}
        className="px-2 py-0.5 bg-brand-gold/10 hover:bg-brand-gold/20 text-brand-gold font-extrabold text-[10px] uppercase tracking-wider rounded border border-brand-gold/30 transition cursor-pointer flex items-center gap-1"
        title="Auto-convert chemical formulas (PCl3 -> PCl₃, Ca2+ -> Ca²⁺, S2- -> S²⁻) and fix accidental line breaks"
      >
        <span>🧪 Auto Chem & Powers Fix</span>
      </button>

      <div className="h-4 w-px bg-brand-border/60 mx-0.5" />

      {/* Subscript Button */}
      <button
        type="button"
        onClick={() => insertOrFormat('SUB')}
        className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-brand-gold font-bold text-xs rounded border border-brand-border/80 transition cursor-pointer"
        title="Subscript (e.g. H₂O, CO₂)"
      >
        x₂
      </button>

      {/* Superscript Button */}
      <button
        type="button"
        onClick={() => insertOrFormat('SUPER')}
        className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-brand-gold font-bold text-xs rounded border border-brand-border/80 transition cursor-pointer"
        title="Superscript (e.g. x², Fe³⁺, S²⁻)"
      >
        x²
      </button>

      {/* Fraction Button */}
      <button
        type="button"
        onClick={() => insertOrFormat('SYMBOL', '\n a \n───\n b \n')}
        className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-brand-gold font-bold text-xs rounded border border-brand-border/80 transition cursor-pointer"
        title="Insert True Stacked Fraction (Numerator over Denominator)"
      >
        ½ Fraction
      </button>

      <div className="h-4 w-px bg-brand-border/60 mx-1" />

      {/* Common Math & Scientific Symbols */}
      {symbols.map((sym) => (
        <button
          key={sym.val}
          type="button"
          onClick={() => insertOrFormat('SYMBOL', sym.val)}
          className="px-1.5 py-0.5 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white font-mono text-xs rounded border border-brand-border/40 transition cursor-pointer"
          title={sym.title}
        >
          {sym.label}
        </button>
      ))}
    </div>
  );
}
