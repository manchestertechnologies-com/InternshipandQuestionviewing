/**
 * Math Render Pipeline
 * ====================
 * Thin wrapper over the existing mathParser.ts.
 * Provides a clean single entry point for the math rendering pipeline.
 *
 * The math pipeline:
 * 1. Applies LaTeX shortcut normalization
 * 2. Converts fractions, roots, exponents, subscripts to LaTeX
 * 3. Returns a string with math segments wrapped in $...$ for KaTeX
 *
 * Output is KaTeX-ready — all math in $...$ or $$...$$ delimiters.
 */

export {
  smartConvertRaw as mathRenderPipeline,
  normalizeLatexShortcuts,
  normalizeLatexExpr,
  normalizePostProcessing,
  textToLaTeX,
  isMathExpression,
} from '@/lib/mathParser';
