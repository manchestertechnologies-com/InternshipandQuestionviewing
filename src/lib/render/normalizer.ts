/**
 * Universal Normalizer
 * ====================
 * Normalizes content from any source (MS Word, Google Docs, PDF paste, plain text)
 * into a clean, structurally-preserved intermediate format.
 *
 * What it preserves:
 * - <b>, <i>, <u>, <strong>, <em> — formatting
 * - <sup>, <sub> — superscripts and subscripts
 * - <table>, <tr>, <td>, <th> — tables
 * - <ul>, <ol>, <li> — lists
 * - <img> — images
 * - LaTeX $...$ and $$...$$ blocks — math
 *
 * What it strips:
 * - MS Word MsoNormal, mso-* class/style attributes
 * - Empty span wrappers with only style attributes
 * - Word namespace XML fragments
 * - Redundant whitespace and blank lines (>2 consecutive)
 */

export interface NormalizerResult {
  /** Cleaned content — HTML tags preserved where semantic */
  content: string;
  /** Detected source type */
  sourceType: 'WORD_HTML' | 'GOOGLE_DOCS_HTML' | 'RICH_HTML' | 'LATEX' | 'PLAIN_TEXT';
  /** Whether any math blocks were detected */
  hasMath: boolean;
  /** Whether any images were detected */
  hasImages: boolean;
  /** Whether tables were detected */
  hasTables: boolean;
}

/**
 * Detect the source type of the raw input payload.
 */
function detectSourceType(raw: string): NormalizerResult['sourceType'] {
  if (
    raw.includes('urn:schemas-microsoft-com:office:word') ||
    raw.includes('mso-') ||
    raw.includes('class="MsoNormal"') ||
    raw.includes('<w:WordDocument>')
  ) {
    return 'WORD_HTML';
  }
  if (
    raw.includes('id="docs-internal-guid"') ||
    raw.includes('docs-internal-guid-')
  ) {
    return 'GOOGLE_DOCS_HTML';
  }
  if (/\\(?:frac|sqrt|int|sum|begin\{)/i.test(raw) && !/<[a-z]/i.test(raw)) {
    return 'LATEX';
  }
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return 'RICH_HTML';
  }
  return 'PLAIN_TEXT';
}

/**
 * Strip MS Word-specific HTML junk while preserving semantic tags.
 */
function stripWordHtmlJunk(html: string): string {
  let res = html;

  // Remove Word namespace declarations
  res = res.replace(/xmlns:[a-zA-Z]+="[^"]*"/g, '');
  res = res.replace(/<\/?(?:o|w|m):[a-zA-Z]+[^>]*>/gi, '');

  // Convert bold/italic spans to semantic tags (handles all inline style variations)
  res = res.replace(
    /<span\s+[^>]*font-weight:\s*(?:bold|700|800|900)[^>]*>([\s\S]*?)<\/span>/gi,
    '<b>$1</b>'
  );
  res = res.replace(
    /<span\s+[^>]*font-style:\s*italic[^>]*>([\s\S]*?)<\/span>/gi,
    '<i>$1</i>'
  );
  res = res.replace(
    /<span\s+[^>]*text-decoration:\s*underline[^>]*>([\s\S]*?)<\/span>/gi,
    '<u>$1</u>'
  );

  // Strip MsoNormal paragraph wrapper but keep content
  res = res.replace(/<p\s+[^>]*class="?Mso[A-Za-z]+"?[^>]*>([\s\S]*?)<\/p>/gi, '$1\n');

  // Strip bare span wrappers that only have style/class attributes (no semantic meaning)
  res = res.replace(/<span\s+(?:class|style)="[^"]*">([\s\S]*?)<\/span>/gi, '$1');

  // Strip empty paragraphs
  res = res.replace(/<p[^>]*>\s*<\/p>/gi, '\n');

  // Clean up excess whitespace
  res = res.replace(/\n{3,}/g, '\n\n').trim();

  return res;
}

/**
 * Preserve LaTeX math blocks from being altered by HTML processing.
 */
function preserveMathBlocks(text: string): { processed: string; mathMap: Map<string, string> } {
  const mathMap = new Map<string, string>();
  let counter = 0;

  // Preserve $$...$$ display math
  let processed = text.replace(/\$\$([\s\S]+?)\$\$/g, (match) => {
    const key = `__MATH_DISPLAY_${counter++}__`;
    mathMap.set(key, match);
    return key;
  });

  // Preserve $...$ inline math
  processed = processed.replace(/\$([^$\n]+)\$/g, (match) => {
    const key = `__MATH_INLINE_${counter++}__`;
    mathMap.set(key, match);
    return key;
  });

  // Preserve \(...\) inline math
  processed = processed.replace(/\\\([\s\S]+?\\\)/g, (match) => {
    const key = `__MATH_PARENS_${counter++}__`;
    mathMap.set(key, match);
    return key;
  });

  // Preserve \[...\] display math
  processed = processed.replace(/\\\[[\s\S]+?\\\]/g, (match) => {
    const key = `__MATH_BRACKET_${counter++}__`;
    mathMap.set(key, match);
    return key;
  });

  return { processed, mathMap };
}

/**
 * Restore preserved math blocks.
 */
function restoreMathBlocks(text: string, mathMap: Map<string, string>): string {
  let res = text;
  for (const [key, value] of mathMap) {
    res = res.replace(key, value);
  }
  return res;
}

/**
 * Main normalizer function.
 * Accepts any content payload and returns a normalized intermediate representation.
 */
export function normalizeContent(raw: string): NormalizerResult {
  if (!raw) {
    return {
      content: '',
      sourceType: 'PLAIN_TEXT',
      hasMath: false,
      hasImages: false,
      hasTables: false,
    };
  }

  const sourceType = detectSourceType(raw);
  const hasMath = /\$[^$]+\$|\$\$[\s\S]+?\$\$|\\(?:frac|sqrt|int|sum)\{/.test(raw);
  const hasImages = /<img\b/i.test(raw) || /data:image\//.test(raw);
  const hasTables = /<table\b/i.test(raw);

  // Preserve math blocks during processing
  const { processed, mathMap } = preserveMathBlocks(raw);

  let content = processed;

  // Apply source-specific normalization
  if (sourceType === 'WORD_HTML') {
    content = stripWordHtmlJunk(content);
  } else if (sourceType === 'GOOGLE_DOCS_HTML') {
    // Google Docs: strip internal guid spans but keep formatting
    content = content.replace(/\s*id="docs-internal-guid-[^"]*"/g, '');
    content = content.replace(/<span\s+[^>]*>([\s\S]*?)<\/span>/gi, '$1');
  } else if (sourceType === 'LATEX') {
    // Pure LaTeX — pass through unchanged
  } else if (sourceType === 'RICH_HTML') {
    // General HTML — convert style spans to semantic tags, then minimal cleanup
    content = content
      .replace(/<span\s+[^>]*font-weight:\s*(?:bold|700|800|900)[^>]*>([\s\S]*?)<\/span>/gi, '<b>$1</b>')
      .replace(/<span\s+[^>]*font-style:\s*italic[^>]*>([\s\S]*?)<\/span>/gi, '<i>$1</i>')
      .replace(/<span\s+[^>]*text-decoration:\s*underline[^>]*>([\s\S]*?)<\/span>/gi, '<u>$1</u>')
      .replace(/<div[^>]*>/gi, '').replace(/<\/div>/gi, '\n');
  }

  // Restore math blocks
  content = restoreMathBlocks(content, mathMap);

  return {
    content,
    sourceType,
    hasMath,
    hasImages,
    hasTables,
  };
}
