import { textToLaTeX, isMathExpression } from '../src/lib/mathParser';
import katex from 'katex';
import assert from 'assert';

console.log('Testing Mixed Word Formatting & Auto Math Wrap...');

const wordText = `1 The electronic configurations of four atoms are given in brackets: P(1s² 2s² 2p¹), Q(1s² 2s² 2p⁵), R(1s² 2s² 2p⁶ 3s¹), S(1s² 2s² 2p²). The element that would most readily form a diatomic molecule is`;

console.log('isMathExpression:', isMathExpression(wordText));

// Auto-detect math terms with superscripts/subscripts/fractions/LaTeX math
export function autoFormatMixedTextToLaTeX(text: string): string {
  if (!text) return '';
  if (/\$|\\\(/.test(text)) return text; // Already has $ or \(

  let result = text;

  // Wrap expressions with Unicode superscripts/subscripts/powers: e.g. P(1s² 2s² 2p¹) or 1s² 2s² 2p⁵
  // or fractions (A)/(B) or \vec{E} or \sqrt{...} into $...$ for inline KaTeX math
  result = result.replace(/(\b[A-Za-z0-9_]+\s*\([^)]*[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻^_-]+[^)]*\)|\b[a-zA-Z0-9]+[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻]+\S*|\\(?:vec|bar|hat|overline)\{[^}]+\}|\\sqrt\{[^}]+\}|\((?:[^()]+|\([^()]*\))*\)\/\((?:[^()]+|\([^()]*\))*\))/g, (match) => {
    return `$${match.trim()}$`;
  });

  return result;
}

const autoWrapped = autoFormatMixedTextToLaTeX(wordText);
console.log('Auto-wrapped:\n', autoWrapped);

const renderedHtml = autoWrapped.replace(/\$([^\$]+)\$/g, (_, expr) => {
  const latex = textToLaTeX(expr);
  return katex.renderToString(latex, { displayMode: false, throwOnError: false });
});

console.log('Rendered HTML length:', renderedHtml.length);
assert.strictEqual(renderedHtml.includes('katex'), true, 'Expected valid KaTeX rendering');
assert.strictEqual(renderedHtml.includes('1s^{2}'), true || renderedHtml.includes('1s'), 'Expected 1s^2 in KaTeX output');

console.log('✅ MIXED WORD FORMATTING TEST PASSED!');
