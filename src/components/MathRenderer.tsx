'use client';

import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { textToLaTeX, normalizeLatexShortcuts, normalizeLatexExpr, smartConvertRaw } from '@/lib/mathParser';

interface MathRendererProps {
  text: string;
  className?: string;
  inline?: boolean;
}

export default function MathRenderer({ text, className = '', inline = false }: MathRendererProps) {
  if (!text) return null;

  // Pre-normalize and smart-convert math patterns into $...$ blocks (matching question-bank-portal reference site)
  const convertedInput = smartConvertRaw(normalizeLatexShortcuts(text));

  // Helper to render LaTeX string via KaTeX safely
  const renderKaTeX = (latexStr: string, isDisplayMode: boolean) => {
    if (!latexStr) return '';
    try {
      const normalized = normalizeLatexExpr(latexStr);
      const formatted = textToLaTeX(normalized);
      const html = katex.renderToString(formatted, {
        displayMode: isDisplayMode,
        throwOnError: false,
        output: 'html',
      });
      return html.replace(/class="katex-error"[^>]*>([^<]+)<\/span>/g, '<span class="text-zinc-200">$1</span>');
    } catch (err) {
      try {
        const fallback = normalizeLatexExpr(latexStr);
        const html = katex.renderToString(fallback, {
          displayMode: isDisplayMode,
          throwOnError: false,
          output: 'html',
        });
        return html.replace(/class="katex-error"[^>]*>([^<]+)<\/span>/g, '<span class="text-zinc-200">$1</span>');
      } catch (e2) {
        const safeText = latexStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return `<span class="text-zinc-200">${safeText}</span>`;
      }
    }
  };

  // Split input into lines to preserve newlines
  const lines = convertedInput.split('\n');

  return (
    <span className={`math-renderer ${inline ? 'inline-block' : 'block'} whitespace-pre-wrap ${className}`}>
      {lines.map((line, lIdx) => {
        if (!line.trim()) {
          return <React.Fragment key={lIdx}>{lIdx > 0 && <br />}</React.Fragment>;
        }

        // Split line by $...$ inline math delimiters and $$...$$ display math delimiters
        const parts = line.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);

        return (
          <React.Fragment key={lIdx}>
            {lIdx > 0 && <br />}
            <span>
              {parts.map((part, pIdx) => {
                if (!part) return null;

                if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
                  const expr = part.slice(2, -2).trim();
                  const html = renderKaTeX(expr, true);
                  return (
                    <span
                      key={pIdx}
                      className="block my-2 overflow-x-auto text-center"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                }

                if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
                  const expr = part.slice(1, -1).trim();
                  const html = renderKaTeX(expr, false);
                  return (
                    <span
                      key={pIdx}
                      className="inline-block align-middle mx-0.5"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                }

                // Plain text segment: render as normal English text
                return <span key={pIdx}>{part}</span>;
              })}
            </span>
          </React.Fragment>
        );
      })}
    </span>
  );
}
