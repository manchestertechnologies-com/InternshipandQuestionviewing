'use client';

import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { textToLaTeX, isMathExpression } from '@/lib/mathParser';

interface MathRendererProps {
  text: string;
  className?: string;
  inline?: boolean;
}

export default function MathRenderer({ text, className = '', inline = false }: MathRendererProps) {
  if (!text) return null;

  // 1. If text contains inline math delimiters $...$ or \(...\)
  if (/\$|\\\(/.test(text)) {
    try {
      const renderedHtml = text.replace(/\$([^\$]+)\$|\\\((.*?)\\\)/g, (match, math1, math2) => {
        const expr = (math1 || math2 || '').trim();
        const latex = textToLaTeX(expr);
        return katex.renderToString(latex, { displayMode: false, throwOnError: false });
      });

      return (
        <span
          className={`math-renderer inline-block align-middle ${className}`}
          dangerouslySetInnerHTML={{ __html: renderedHtml }}
        />
      );
    } catch (e) {
      console.warn('KaTeX mixed inline rendering fallback:', e);
    }
  }

  // 2. Check if text contains math
  if (!isMathExpression(text)) {
    return <span className={className}>{text}</span>;
  }

  try {
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
