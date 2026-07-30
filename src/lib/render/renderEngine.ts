/**
 * Render Engine — Central Pipeline Entry Point
 * =============================================
 * This is the single entry point for all question content rendering.
 *
 * Pipeline:
 *   Input text + subject
 *     ↓
 *   Subject-aware parser dispatch
 *     ↓
 *   Rendered output (KATEX / UNICODE / HTML / PLAIN)
 *
 * CRITICAL RULES:
 * - Chemistry NEVER produces LaTeX output. Always Unicode.
 * - Math/Physics always produce KaTeX-ready output ($...$).
 * - Biology preserves structure with HTML formatting.
 * - The output of this engine is passed directly to QuestionRenderer.tsx.
 * - No subject shares another subject's parser.
 */

import { parseChemistry } from './chemistry/chemistryParser';
import { parsePhysics } from './physics/physicsParser';
import { parseBiology } from './biology/biologyParser';
import { mathRenderPipeline } from './math/mathParser';

export type SubjectKey =
  | 'Mathematics'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'Botany'
  | 'Zoology'
  | 'Computer Science'
  | 'General'
  | string;

export type RenderOutputType = 'KATEX' | 'UNICODE' | 'HTML' | 'PLAIN';

export interface RenderResult {
  /** Processed output text — format depends on `type` */
  processedText: string;
  /** How the output should be rendered */
  type: RenderOutputType;
  /** Original subject */
  subject: SubjectKey;
}

/**
 * Dispatch table — maps subject to its parser and output type.
 */
const SUBJECT_PARSERS: Record<string, { parser: (text: string) => string; type: RenderOutputType }> = {
  Mathematics: { parser: mathRenderPipeline, type: 'KATEX' },
  Physics:     { parser: parsePhysics,       type: 'KATEX' },
  Chemistry:   { parser: parseChemistry,     type: 'UNICODE' },
  Biology:     { parser: parseBiology,       type: 'HTML' },
  Botany:      { parser: parseBiology,       type: 'HTML' },
  Zoology:     { parser: parseBiology,       type: 'HTML' },
};

/**
 * Render a text segment for a given subject.
 *
 * @param text   Raw input text (from paste, typing, or database)
 * @param subject The subject category to use for rendering
 * @returns RenderResult with processedText and output type
 */
export function renderForSubject(text: string, subject: SubjectKey = 'Physics'): RenderResult {
  if (!text) {
    return { processedText: '', type: 'PLAIN', subject };
  }

  // Normalize the subject key
  const normalizedSubject = subject?.trim() || 'Physics';

  // Look up the parser for this subject
  const entry = SUBJECT_PARSERS[normalizedSubject];

  if (entry) {
    const processedText = entry.parser(text);
    return { processedText, type: entry.type, subject: normalizedSubject };
  }

  // Default: Computer Science and General → math pipeline (handles code blocks + equations)
  const processedText = mathRenderPipeline(text);
  return { processedText, type: 'KATEX', subject: normalizedSubject };
}

/**
 * Auto-detect the best subject based on content analysis,
 * then render accordingly.
 *
 * Used when no explicit subject is provided.
 */
export function autoRender(text: string): RenderResult {
  if (!text) return { processedText: '', type: 'PLAIN', subject: 'General' };

  const lower = text.toLowerCase();

  // Chemistry detection — highest priority to avoid LaTeX corruption
  if (
    /[A-Z][a-z]?\d+[A-Z]/.test(text) || // e.g. H2O, CO2, NaCl
    /\^\s*\(?\d*[+\-]/.test(text) ||      // e.g. SO4^2-, Fe^3+
    /\b(oxidation|reduction|molarity|pH|acid|base|catalyst|orbital|valency)\b/i.test(text) ||
    /\b(ion|ionic|covalent|polyatomic|electrolyte|precipitate)\b/i.test(text) ||
    /->|<->|<=>/.test(text)                // Reaction arrows
  ) {
    return renderForSubject(text, 'Chemistry');
  }

  // Biology detection
  if (
    /\b(cell|tissue|organ|gene|chromosome|dna|rna|mitosis|meiosis|photosynthesis)\b/i.test(lower) ||
    /\b([A-Z][a-z]{3,})\s+([a-z]{3,})\b/.test(text) // Binomial names
  ) {
    return renderForSubject(text, 'Biology');
  }

  // Physics detection
  if (
    /[αβγδεθλμπσφχωΔΩ]/.test(text) ||
    /\\(?:vec|hat|omega|alpha|beta|mu|Delta|lambda|theta|pi)\b/.test(text) ||
    /\b(velocity|acceleration|force|momentum|impedance|resistance|capacitance|wavelength|frequency)\b/i.test(lower)
  ) {
    return renderForSubject(text, 'Physics');
  }

  // Default: Mathematics pipeline
  return renderForSubject(text, 'Mathematics');
}
