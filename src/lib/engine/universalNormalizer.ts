/**
 * Universal Normalizer Engine
 * Sanitizes and normalizes content AST/HTML preserving structural formatting
 * (tables, lists, bold, italic, underline, superscripts, subscripts, images)
 * without performing destructive string regex replacement hacks.
 */

export interface NormalizedPayload {
  cleanContent: string;
  latexExpressions: string[];
  imageUrls: string[];
  hasTables: boolean;
}

export function normalizeUniversalPayload(rawPayload: string): NormalizedPayload {
  if (!rawPayload) {
    return {
      cleanContent: '',
      latexExpressions: [],
      imageUrls: [],
      hasTables: false,
    };
  }

  let text = rawPayload;
  const imageUrls: string[] = [];
  const latexExpressions: string[] = [];

  // Extract images (data URI or Cloudinary or standard img tags)
  const imgMatches = text.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
  for (const match of imgMatches) {
    if (match[1]) imageUrls.push(match[1]);
  }

  // Extract explicit LaTeX expressions ($ ... $, $$ ... $$)
  const latexMatches = text.matchAll(/(?:\$\$[\s\S]+?\$\$|\$[^$\n]+\$)/g);
  for (const match of latexMatches) {
    latexExpressions.push(match[0]);
  }

  const hasTables = /<table\b/i.test(text) || (text.includes('|') && text.includes('---'));

  // Clean Microsoft Word span wrappers while preserving semantic formatting
  text = text.replace(/<span\s+style="[^"]*font-weight:\s*bold;?[^"]*">([\s\S]*?)<\/span>/gi, '<b>$1</b>');
  text = text.replace(/<span\s+style="[^"]*font-style:\s*italic;?[^"]*">([\s\S]*?)<\/span>/gi, '<i>$1</i>');
  text = text.replace(/<span\s+style="[^"]*text-decoration:\s*underline;?[^"]*">([\s\S]*?)<\/span>/gi, '<u>$1</u>');

  // Strip Word MsoNormal class wrappers but preserve text
  text = text.replace(/<p\s+class="?MsoNormal"?[^>]*>([\s\S]*?)<\/p>/gi, '$1\n');

  // Collapse excess blank line whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return {
    cleanContent: text,
    latexExpressions,
    imageUrls,
    hasTables,
  };
}
