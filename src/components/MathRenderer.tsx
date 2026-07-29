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

  // Pre-normalize common LaTeX shortcuts (e.g. \wt -> \omega t, Vrms -> V_{rms})
  const rawInput = normalizeLatexShortcuts(text);

  // Helper to render LaTeX string via KaTeX safely
  const renderKaTeX = (latexStr: string, isDisplayMode: boolean) => {
    try {
      const formatted = textToLaTeX(latexStr);
      return katex.renderToString(formatted, {
        displayMode: isDisplayMode,
        throwOnError: false,
        output: 'html',
      });
    } catch (err) {
      return katex.renderToString(latexStr, {
        displayMode: isDisplayMode,
        throwOnError: false,
        output: 'html',
      });
    }
  };

  // Step 1: Parse Display Math Blocks \[ ... \] and $$ ... $$ FIRST across entire multi-line string
  const blockMathRegex = /(?:\\\[([\s\S]*?)\\\]|\$\$([\s\S]*?)\$\$)/g;

  const segments: { type: 'text' | 'block'; content: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockMathRegex.exec(rawInput)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: rawInput.substring(lastIndex, match.index) });
    }
    const blockContent = match[1] ?? match[2];
    segments.push({ type: 'block', content: blockContent.trim() });
    lastIndex = blockMathRegex.lastIndex;
  }

  if (lastIndex < rawInput.length) {
    segments.push({ type: 'text', content: rawInput.substring(lastIndex) });
  }

  // Tokenizer regex for inline math and math expressions in plain text lines:
  // 1. Explicit $...$ or \(...\)
  // 2. \frac{...}{...} (supporting nested braces)
  // 3. \sqrt{...}
  // 4. Standalone LaTeX commands (\omega, \pi, \Delta, \alpha, \beta, \int, \sum, \approx, \rightarrow, \text{...})
  // 5. Equations / Math expressions like `i = I_0 \sin(\omega t)` or `E_0 = 141 V` or `\omega t = \frac{\pi}{2}`
  const inlineTokenRegex = /(\$[^$\n]+\$|\\\([^)]+\\\)|\\frac\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\\sqrt\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}|\\(?:omega|pi|Delta|alpha|beta|theta|lambda|mu|sigma|Omega|int|sum|pm|times|div|le|ge|ne|infty|rightarrow|vec|bar|hat|overline|text|approx|therefore)\b(?:\s*\{[^{}]*\}|\s*\([^()]*\))?|(?:\b[a-zA-Z0-9_\theta\pi\omega\Delta]+(?:_[a-zA-Z0-9{}]+|\^[a-zA-Z0-9{}]+)?\s*(?:=|\approx|\\approx|\rightarrow|\\rightarrow|\+|-|\*|\/)\s*)+[^,;\n\(\)]+?(?=\s*(?:[.,;!]?(\s+(?:with|when|where|for|at|is|are|and|or|so|then|hence|from|to|which|that|the|Option|Choice|Part|Section|Statement|Assertion|Reason)\b|\s*$))|\)|\]|\}))/g;

  return (
    <span className={`math-renderer ${inline ? 'inline-block' : 'block'} whitespace-pre-wrap ${className}`}>
      {segments.map((seg, sIdx) => {
        if (seg.type === 'block') {
          const html = renderKaTeX(seg.content, true);
          return (
            <span
              key={`b-${sIdx}`}
              className="block my-2 overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        const lines = seg.content.split('\n');
        return (
          <React.Fragment key={`tseg-${sIdx}`}>
            {lines.map((line, lIdx) => {
              if (!line.trim()) {
                return <React.Fragment key={lIdx}>{lIdx > 0 && <br />}</React.Fragment>;
              }

              const lineElements: React.ReactNode[] = [];
              let lineLastIdx = 0;
              let inlineMatch: RegExpExecArray | null;

              inlineTokenRegex.lastIndex = 0;
              while ((inlineMatch = inlineTokenRegex.exec(line)) !== null) {
                if (inlineMatch.index > lineLastIdx) {
                  const plainTextPart = line.substring(lineLastIdx, inlineMatch.index);
                  lineElements.push(<span key={`t-${lineLastIdx}`}>{plainTextPart}</span>);
                }

                let rawExpr = inlineMatch[0];
                if (rawExpr.startsWith('$') && rawExpr.endsWith('$')) {
                  rawExpr = rawExpr.slice(1, -1).trim();
                } else if (rawExpr.startsWith('\\(') && rawExpr.endsWith('\\)')) {
                  rawExpr = rawExpr.slice(2, -2).trim();
                }

                const html = renderKaTeX(rawExpr, false);
                lineElements.push(
                  <span
                    key={`m-${inlineMatch.index}`}
                    className="inline-block align-middle mx-0.5"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                );
                lineLastIdx = inlineTokenRegex.lastIndex;
              }

              if (lineLastIdx < line.length) {
                const plainTextPart = line.substring(lineLastIdx);
                lineElements.push(<span key={`t-${lineLastIdx}`}>{plainTextPart}</span>);
              }

              if (lineElements.length === 0) {
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
                  <span>{lineElements}</span>
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })}
    </span>
  );
}
