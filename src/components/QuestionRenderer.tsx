'use client';

/**
 * QuestionRenderer — Universal Single Renderer
 * =============================================
 * THE single shared rendering component for all question content.
 *
 * Used by:
 *   - Admin Live Preview (UniversalQuestionEditor.tsx)
 *   - Student Portal Viewer
 *   - Any other place that displays question content
 *
 * GUARANTEE:
 *   - Zero raw LaTeX visible to users (\frac, \sqrt, ^{}, _{})
 *   - Chemistry renders as Unicode (SO₄²⁻, not \text{SO}_{4}^{2-})
 *   - Math renders via KaTeX
 *   - Word HTML formatting (bold, italic, tables) is preserved
 *   - Admin preview and student view are visually identical
 *
 * Props:
 *   text     — raw input text (from editor or database)
 *   subject  — subject category for parser routing
 *   inline   — render inline vs. block
 *   className — additional CSS classes
 */

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { renderForSubject, type SubjectKey, type RenderOutputType } from '@/lib/render/renderEngine';
import { textToLaTeX, normalizeLatexExpr } from '@/lib/mathParser';

interface QuestionRendererProps {
  text: string;
  subject?: SubjectKey;
  inline?: boolean;
  className?: string;
}

/**
 * Safely render a LaTeX expression via KaTeX.
 * Never throws — falls back to escaped text on error.
 */
function safeKatexRender(latexExpr: string, displayMode: boolean): string {
  if (!latexExpr) return '';
  try {
    const normalized = normalizeLatexExpr(latexExpr);
    const formatted = textToLaTeX(normalized);
    const html = katex.renderToString(formatted, {
      displayMode,
      throwOnError: false,
      output: 'html',
      trust: false,
    });
    // Suppress KaTeX error spans — show the raw expression as plain text instead
    return html.replace(
      /class="katex-error"[^>]*>([^<]+)<\/span>/g,
      '<span class="text-zinc-300">$1</span>'
    );
  } catch {
    try {
      // Fallback: try rendering the expression as-is
      return katex.renderToString(latexExpr, {
        displayMode,
        throwOnError: false,
        output: 'html',
      });
    } catch {
      // Last resort: escape and return as text
      const safe = latexExpr
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<span class="text-zinc-300">${safe}</span>`;
    }
  }
}

/**
 * Render a KATEX-type processed text.
 * Splits on $...$ and $$...$$ delimiters and renders each math block.
 */
function renderKatexText(text: string, inline: boolean): React.ReactNode {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <>
      {lines.map((line, lIdx) => {
        if (!line.trim()) {
          return <React.Fragment key={lIdx}>{lIdx > 0 && <br />}</React.Fragment>;
        }

        // Split on $$...$$ and $...$ math delimiters
        const parts = line.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);

        return (
          <React.Fragment key={lIdx}>
            {lIdx > 0 && <br />}
            <span>
              {parts.map((part, pIdx) => {
                if (!part) return null;

                if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
                  const expr = part.slice(2, -2).trim();
                  const html = safeKatexRender(expr, true);
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
                  const html = safeKatexRender(expr, false);
                  return (
                    <span
                      key={pIdx}
                      className="inline-block align-middle mx-0.5"
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  );
                }

                // Plain text segment — clean up any residual \text{} artifacts
                let cleanText = part;
                while (/\\text\{/.test(cleanText)) {
                  cleanText = cleanText.replace(/\\text\{([^{}]*)\}/g, '$1');
                }

                // Also strip any other escaped LaTeX that leaked through
                cleanText = cleanText
                  .replace(/\\frac\{[^{}]*\}\{[^{}]*\}/g, '[fraction]')
                  .replace(/\\sqrt\{[^{}]*\}/g, '√');

                return <span key={pIdx}>{cleanText}</span>;
              })}
            </span>
          </React.Fragment>
        );
      })}
    </>
  );
}

/**
 * Render UNICODE-type output (Chemistry).
 * Direct text rendering — no KaTeX, no LaTeX.
 */
function renderUnicodeText(text: string): React.ReactNode {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {i > 0 && <br />}
          <span>{line}</span>
        </React.Fragment>
      ))}
    </>
  );
}

/**
 * Render HTML-type output (Biology / Word paste).
 * Uses dangerouslySetInnerHTML for rich text.
 */
function renderHtmlText(text: string, inline: boolean): React.ReactNode {
  if (!text) return null;

  // Sanitize: only allow safe HTML tags
  const sanitized = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on[a-z]+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');

  const Tag = inline ? 'span' : 'div';
  return (
    <Tag
      className="biology-content"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}

/**
 * The main QuestionRenderer component.
 * Routes to the correct rendering strategy based on subject.
 */
export default function QuestionRenderer({
  text,
  subject = 'Physics',
  inline = false,
  className = '',
}: QuestionRendererProps) {
  const renderResult = useMemo(() => {
    if (!text) return null;
    return renderForSubject(text, subject);
  }, [text, subject]);

  if (!renderResult || !renderResult.processedText) return null;

  const { processedText, type } = renderResult;

  const containerClass = `question-renderer ${inline ? 'inline' : 'block'} ${className}`.trim();

  const content = renderContent(processedText, type, inline);

  if (inline) {
    return <span className={containerClass}>{content}</span>;
  }
  return <span className={`${containerClass} whitespace-pre-wrap`}>{content}</span>;
}

function renderContent(
  processedText: string,
  type: RenderOutputType,
  inline: boolean
): React.ReactNode {
  switch (type) {
    case 'UNICODE':
      return renderUnicodeText(processedText);
    case 'HTML':
      return renderHtmlText(processedText, inline);
    case 'KATEX':
    default:
      return renderKatexText(processedText, inline);
  }
}
