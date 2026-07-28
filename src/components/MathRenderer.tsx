'use client';

import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { textToLaTeX, isMathExpression, autoFormatMixedTextToLaTeX } from '@/lib/mathParser';

interface MathRendererProps {
  text: string;
  className?: string;
  inline?: boolean;
}

export default function MathRenderer({ text, className = '', inline = false }: MathRendererProps) {
  if (!text) return null;

  // Process mixed text auto-wrapping if text has no explicit $ or \(
  let processedText = text;
  if (!/\$|\\\(/.test(text)) {
    processedText = autoFormatMixedTextToLaTeX(text);
  }

  // 1. If processedText contains inline math delimiters $...$ or \(...\)
  if (/\$|\\\(/.test(processedText)) {
    try {
      const lines = processedText.split('\n');
      return (
        <span className={`math-renderer inline-block align-middle ${className}`}>
          {lines.map((line, lIdx) => {
            const renderedLineHtml = line.replace(/\$([^\$]+)\$|\\\((.*?)\\\)/g, (match, math1, math2) => {
              const expr = (math1 || math2 || '').trim();
              const latex = textToLaTeX(expr);
              return katex.renderToString(latex, { displayMode: false, throwOnError: false });
            });

            return (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                <span dangerouslySetInnerHTML={{ __html: renderedLineHtml }} />
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
  if (!isMathExpression(text)) {
    const lines = text.split('\n');
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
    const lines = text.split('\n');
    if (lines.length > 1) {
      return (
        <span className={`math-renderer inline-block align-middle ${className}`}>
          {lines.map((line, lIdx) => {
            const latex = textToLaTeX(line);
            const html = katex.renderToString(latex, {
              displayMode: !inline,
              throwOnError: false,
              output: 'html',
            });
            return (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                <span dangerouslySetInnerHTML={{ __html: html }} />
              </React.Fragment>
            );
          })}
        </span>
      );
    }

    const latex = textToLaTeX(text);
    const html = katex.renderToString(latex, {
      displayMode: !inline,
      throwOnError: false,
      output: 'html',
    });

    return (
      <span
        className={`math-renderer inline-block align-middle ${className}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  } catch (e) {
    console.warn('KaTeX rendering fallback:', e);
    return <span className={className}>{text}</span>;
  }
}
