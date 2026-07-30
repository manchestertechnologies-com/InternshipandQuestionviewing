/**
 * Content Detection Engine
 * Inspects incoming content payloads (Word HTML, Google Docs HTML, LaTeX, Markdown, Unicode, Plain Text)
 * and categorizes them into specific format types for format-aware processing pipelines.
 */

export type ContentFormat =
  | 'WORD_HTML'
  | 'GOOGLE_DOCS_HTML'
  | 'LATEX_SOURCE'
  | 'RICH_TEXT_HTML'
  | 'MARKDOWN'
  | 'UNICODE_MATH'
  | 'PLAIN_TEXT';

export interface ContentDetectionResult {
  format: ContentFormat;
  confidence: number;
  hasMath: boolean;
  hasLaTeX: boolean;
  hasHtml: boolean;
  hasImages: boolean;
  hasTables: boolean;
}

export function detectContentFormat(payload: string): ContentDetectionResult {
  if (!payload || typeof payload !== 'string') {
    return {
      format: 'PLAIN_TEXT',
      confidence: 1.0,
      hasMath: false,
      hasLaTeX: false,
      hasHtml: false,
      hasImages: false,
      hasTables: false,
    };
  }

  const str = payload.trim();

  const isWordHtml =
    str.includes('urn:schemas-microsoft-com:office:word') ||
    str.includes('mso-') ||
    str.includes('class="MsoNormal"') ||
    str.includes('<w:WordDocument>') ||
    str.includes('xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"');

  const isGoogleDocsHtml =
    str.includes('id="docs-internal-guid"') ||
    str.includes('docs-internal-guid-');

  const hasHtml = /<[a-z][\s\S]*>/i.test(str);
  const hasTables = /<table\b/i.test(str) || (str.includes('|') && str.includes('---'));
  const hasImages = /<img\b/i.test(str) || str.includes('data:image/') || str.includes('{{IMG::');

  const hasLaTeX =
    /(?:\$[^$\n]+\$|\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\\begin\{[a-zA-Z*]+\})/.test(str) ||
    /\\(?:frac|sqrt|sum|int|lim|alpha|beta|gamma|theta|lambda|mu|pi|omega|Delta|vec|hat|left|right)\b/.test(str);

  const hasUnicodeMath = /[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻∫∑√±≤≥≠∞αβγδεθλµπσϕχωΔΩ]/.test(str);
  const hasMath = hasLaTeX || hasUnicodeMath || /[A-Za-z0-9_]+\s*=\s*[A-Za-z0-9_+\-*\/^()]/.test(str);

  let format: ContentFormat = 'PLAIN_TEXT';
  let confidence = 0.8;

  if (isWordHtml) {
    format = 'WORD_HTML';
    confidence = 0.98;
  } else if (isGoogleDocsHtml) {
    format = 'GOOGLE_DOCS_HTML';
    confidence = 0.95;
  } else if (hasLaTeX && !hasHtml) {
    format = 'LATEX_SOURCE';
    confidence = 0.92;
  } else if (hasHtml) {
    format = 'RICH_TEXT_HTML';
    confidence = 0.90;
  } else if (str.startsWith('#') || str.includes('**') || str.includes('```')) {
    format = 'MARKDOWN';
    confidence = 0.85;
  } else if (hasUnicodeMath) {
    format = 'UNICODE_MATH';
    confidence = 0.88;
  }

  return {
    format,
    confidence,
    hasMath,
    hasLaTeX,
    hasHtml,
    hasImages,
    hasTables,
  };
}
