'use client';

import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { textToLaTeX, isMathExpression, autoFormatMixedTextToLaTeX, normalizeLatexShortcuts } from '@/lib/mathParser';

interface MathRendererProps {
  text: string;
  className?: string;
  inline?: boolean;
}

export default function MathRenderer({ text, className = '', inline = false }: MathRendererProps) {
  if (!text) return null;

  const normalizedInput = normalizeLatexShortcuts(text);

  // Process mixed text auto-wrapping if text has no explicit $ or \(
  let processedText = normalizedInput;
  if (!/\$|\\\(/.test(normalizedInput)) {
    processedText = autoFormatMixedTextToLaTeX(normalizedInput);
  }

  const renderMathString = (expr: string, isDisplay: boolean) => {
    try {
      const latex = textToLaTeX(expr);
      return katex.renderToString(latex, { displayMode: isDisplay, throwOnError: false, output: 'html' });
    } catch (e) {
      return expr;
    }
  };

  // 1. If processedText contains inline math delimiters $...$ or \(...\)
  if (/\$|\\\(/.test(processedText)) {
    try {
      const lines = processedText.split('\n');
      return (
        <span className={`math-renderer inline-block align-middle ${className}`}>
          {lines.map((line, lIdx) => {
            const regex = /\$([^\$]+)\$|\\\((.*?)\\\)/g;
            const elements: React.ReactNode[] = [];
            let lastIndex = 0;
            let match: RegExpExecArray | null;

            while ((match = regex.exec(line)) !== null) {
              if (match.index > lastIndex) {
                elements.push(<span key={`t-${lastIndex}`}>{line.substring(lastIndex, match.index)}</span>);
              }
              const mathExpr = (match[1] || match[2] || '').trim();
              const html = renderMathString(mathExpr, false);
              elements.push(<span key={`m-${match.index}`} dangerouslySetInnerHTML={{ __html: html }} />);
              lastIndex = regex.lastIndex;
            }

            if (lastIndex < line.length) {
              elements.push(<span key={`t-${lastIndex}`}>{line.substring(lastIndex)}</span>);
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
    } catch (e) {
      console.warn('KaTeX mixed inline rendering fallback:', e);
    }
  }

  // 2. Check if text contains math
  if (!isMathExpression(normalizedInput)) {
    const lines = normalizedInput.split('\n');
    return (
      <span className={className}>
        {lines.map((line, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </span>
    );
  }

  try {
    const lines = normalizedInput.split('\n');
    return (
      <span className={`math-renderer inline-block align-middle ${className}`}>
        {lines.map((line, lIdx) => {
          // If line has plain English words (>= 3 chars) mixed with LaTeX commands/math, segment into text & math
          const cleanLine = line.replace(/\\(?:frac|sqrt|omega|pi|Delta|alpha|beta|theta|lambda|mu|sigma|Omega|text|sin|cos|tan|log|ln)/g, '');
          const hasEnglishWords = /[a-zA-Z]{4,}/.test(cleanLine);

          if (hasEnglishWords && /\\|\=|\^|_|\//.test(line)) {
            const regex = /(\\frac\{[^{}]+\}\{[^{}]+\}|\\sqrt\{[^{}]+\}|\\[a-zA-Z]+\b(?:\{[^{}]*\}|\([^()]*\)|[a-zA-Z0-9_*^/-])*(?:\s*=\s*[^,.!?;\n]+)?|\b[a-zA-Z0-9_]+\s*=\s*(?:\\?[a-zA-Z0-9_+\-*\/^()\\.{}\s]+)|\b[a-zA-Z0-9_]+(?:\/[a-zA-Z0-9_\sqrt{}\\]+|\^[0-9_{}\-]+)+|\b\d+(?:\.\d+)?\s*(?:[xX*×]|\\times)\s*10\^?\{?[-\d]+\}?)/g;
            const elements: React.ReactNode[] = [];
            let lastIndex = 0;
            let match: RegExpExecArray | null;

            while ((match = regex.exec(line)) !== null) {
              if (match.index > lastIndex) {
                elements.push(<span key={`t-${lastIndex}`}>{line.substring(lastIndex, match.index)}</span>);
              }
              const html = renderMathString(match[0], false);
              elements.push(<span key={`m-${match.index}`} dangerouslySetInnerHTML={{ __html: html }} />);
              lastIndex = regex.lastIndex;
            }

            if (lastIndex < line.length) {
              elements.push(<span key={`t-${lastIndex}`}>{line.substring(lastIndex)}</span>);
            }

            return (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                <span>{elements}</span>
              </React.Fragment>
            );
          }

          const html = renderMathString(line, inline);
          return (
            <React.Fragment key={lIdx}>
              {lIdx > 0 && <br />}
              <span dangerouslySetInnerHTML={{ __html: html }} />
            </React.Fragment>
          );
        })}
      </span>
    );
  } catch (e) {
    console.warn('KaTeX rendering fallback:', e);
    return <span className={className}>{normalizedInput}</span>;
  }
}
