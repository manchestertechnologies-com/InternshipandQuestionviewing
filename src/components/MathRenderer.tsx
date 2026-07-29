'use client';

import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { textToLaTeX, normalizeLatexShortcuts } from '@/lib/mathParser';

interface MathRendererProps {
  text: string;
  className?: string;
  inline?: boolean;
}

export default function MathRenderer({ text, className = '', inline = false }: MathRendererProps) {
  if (!text) return null;

  const normalizedInput = normalizeLatexShortcuts(text);
  const lines = normalizedInput.split('\n');

  const renderMathChunk = (expr: string) => {
    try {
      const latex = textToLaTeX(expr);
      return katex.renderToString(latex, { displayMode: false, throwOnError: false, output: 'html' });
    } catch (e) {
      return expr;
    }
  };

  // Regex to match specific math/latex/chemistry expressions inside a line
  // 1. Explicit $...$ or \(...\)
  // 2. \frac{...}{...}, \sqrt{...}, \int, \sum, \omega, \pi, \Delta, \alpha, \beta, etc.
  // 3. Chemical formulas & subscripts: CH_3COOAg, CH_3Br, CO_2, Ag_2O, SO_4^{2-}, Ca^{2+}, H₂O
  // 4. Equations like i = I_o sin(\omega t), \omega t = \frac{\pi}{2}
  const mathTokenRegex = /(\$[^$]+\$|\\\([^)]+\\\)|\\frac\{[^{}]*\}\{[^{}]*\}|\\sqrt\{[^{}]*\}|\\(?:omega|pi|Delta|alpha|beta|theta|lambda|mu|sigma|Omega|int|sum|pm|times|div|le|ge|ne|infty|rightarrow|vec|bar|hat|overline)\b|\\[a-zA-Z]+|\b[A-Za-z0-9]+(?:_[0-9a-zA-Z{}]+|\^[0-9a-zA-Z{}+\-]+)+\S*|\b[a-zA-Z0-9_]+\s*=\s*(?:\\?[a-zA-Z0-9_+\-*\/^()\\.{}\s]+)|[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻]+)/g;

  return (
    <span className={`math-renderer inline-block align-middle whitespace-pre-wrap ${className}`}>
      {lines.map((line, lIdx) => {
        if (!line.trim()) {
          return <React.Fragment key={lIdx}>{lIdx > 0 && <br />}</React.Fragment>;
        }

        const elements: React.ReactNode[] = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;

        mathTokenRegex.lastIndex = 0;
        while ((match = mathTokenRegex.exec(line)) !== null) {
          if (match.index > lastIndex) {
            const textPart = line.substring(lastIndex, match.index);
            elements.push(<span key={`t-${lastIndex}`}>{textPart}</span>);
          }

          let rawExpr = match[0];
          if (rawExpr.startsWith('$') && rawExpr.endsWith('$')) {
            rawExpr = rawExpr.slice(1, -1).trim();
          } else if (rawExpr.startsWith('\\(') && rawExpr.endsWith('\\)')) {
            rawExpr = rawExpr.slice(2, -2).trim();
          }

          const html = renderMathChunk(rawExpr);
          elements.push(<span key={`m-${match.index}`} dangerouslySetInnerHTML={{ __html: html }} />);
          lastIndex = mathTokenRegex.lastIndex;
        }

        if (lastIndex < line.length) {
          const textPart = line.substring(lastIndex);
          elements.push(<span key={`t-${lastIndex}`}>{textPart}</span>);
        }

        if (elements.length === 0) {
          return (
            <React.Fragment key={lIdx}>
              {lIdx > 0 && <br />}
              <span>{line}</span>
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={lIdx}>
            {lIdx > 0 && <br />}
            <span>{elements}</span>
          </React.Fragment>
        );
      })}
    </span>
  );
}
