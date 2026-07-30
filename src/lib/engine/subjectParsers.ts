/**
 * Subject Parsers Module
 * Dedicated AST and Tokenizer parsers for Mathematics, Physics, Chemistry, Biology, Botany, and Zoology.
 */

import { smartConvertRaw, normalizePostProcessing } from '@/lib/mathParser';

export interface ParsedSubjectPayload {
  renderedText: string;
  subject: string;
  mathBlocksCount: number;
}

/**
 * MATHEMATICS PARSER ENGINE
 */
export function parseMathematicsContent(rawText: string): ParsedSubjectPayload {
  const renderedText = smartConvertRaw(rawText);
  const mathBlocksCount = (renderedText.match(/\$[^$\n]+\$/g) || []).length;
  return {
    renderedText,
    subject: 'MATHEMATICS',
    mathBlocksCount
  };
}

/**
 * PHYSICS PARSER ENGINE
 */
export function parsePhysicsContent(rawText: string): ParsedSubjectPayload {
  let text = smartConvertRaw(rawText);
  // Ensure physics vectors and unit fractions are properly formatted
  text = text.replace(/\\vec\s*\{([a-zA-Z]+)\}/g, '\\vec{$1}');
  text = text.replace(/\\hat\s*\{([a-zA-Z]+)\}/g, '\\hat{$1}');

  const mathBlocksCount = (text.match(/\$[^$\n]+\$/g) || []).length;
  return {
    renderedText: text,
    subject: 'PHYSICS',
    mathBlocksCount
  };
}

/**
 * CHEMISTRY PARSER ENGINE
 */
export function parseChemistryContent(rawText: string): ParsedSubjectPayload {
  let text = smartConvertRaw(rawText);

  // Chemistry ion charges: TiF6^2- -> TiF_{6}^{2-}
  text = text.replace(/([A-Z][a-z]?[0-9₀₁₂₃₄₅₆₇₈₉]*)\^\(?(\d*[-+]|[-+]\d+|\d+)\)?/g, (m, formula, charge) => {
    let sign = charge.includes('-') ? '-' : '+';
    let num = charge.replace(/[-+]/g, '').trim();
    if (!num) num = '';
    return `$${formula}^{${num}${sign}}$`;
  });

  const mathBlocksCount = (text.match(/\$[^$\n]+\$/g) || []).length;
  return {
    renderedText: text,
    subject: 'CHEMISTRY',
    mathBlocksCount
  };
}

/**
 * BIOLOGY, BOTANY & ZOOLOGY PARSER ENGINE
 */
export function parseBiologyContent(rawText: string, subjectType: 'BIOLOGY' | 'BOTANY' | 'ZOOLOGY' = 'BIOLOGY'): ParsedSubjectPayload {
  let text = smartConvertRaw(rawText);

  // Format genetics F1/F2 generations
  text = text.replace(/\b([FP])([123])\b/g, '$1_$2');

  // Format biochemical terms
  text = text.replace(/\bFADH2\b/g, '$FADH_{2}$');
  text = text.replace(/\bNADH2\b/g, '$NADH_{2}$');

  const mathBlocksCount = (text.match(/\$[^$\n]+\$/g) || []).length;
  return {
    renderedText: text,
    subject: subjectType,
    mathBlocksCount
  };
}

/**
 * UNIVERSAL DISPATCHER
 */
export function parseContentBySubject(rawText: string, subject: string): ParsedSubjectPayload {
  const normSubj = (subject || '').toUpperCase().trim();

  switch (normSubj) {
    case 'MATHEMATICS':
    case 'MATH':
      return parseMathematicsContent(rawText);
    case 'PHYSICS':
      return parsePhysicsContent(rawText);
    case 'CHEMISTRY':
      return parseChemistryContent(rawText);
    case 'BIOLOGY':
      return parseBiologyContent(rawText, 'BIOLOGY');
    case 'BOTANY':
      return parseBiologyContent(rawText, 'BOTANY');
    case 'ZOOLOGY':
      return parseBiologyContent(rawText, 'ZOOLOGY');
    default:
      return {
        renderedText: smartConvertRaw(rawText),
        subject: normSubj || 'GENERAL',
        mathBlocksCount: (rawText.match(/\$[^$\n]+\$/g) || []).length
      };
  }
}
