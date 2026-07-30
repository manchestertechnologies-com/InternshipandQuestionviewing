import katex from 'katex';
import { textToLaTeX, normalizeLatexExpr, normalizeLatexShortcuts, smartConvertRaw } from '../src/lib/mathParser';

// String from user's exact screenshot:
const screenshotRawInput = `Concept: Transition elements generally have the electronic configuration $$\\left[ \\left(n-1\\right)d^{1-10}ns^{0-2}, \\right]$ with known stability-based exceptions.`;

console.log('--- RAW SCREENSHOT INPUT ---');
console.log(screenshotRawInput);

function cleanCorruptDelimitersAndEscapes(text: string): string {
  let res = text;
  // 1. Unescape double backslashes before LaTeX commands: \\left -> \left, \\right -> \right, \\frac -> \frac, \\vec -> \vec, \\alpha -> \alpha
  res = res.replace(/\\\\([a-zA-Z]+|\[|\]|\(|\))/g, '\\$1');

  // 2. Fix mismatched $$ ... $ -> $ ... $ or $$ ... $$
  res = res.replace(/\$\$\$*/g, '$'); // collapse $$$ or $$ to $ if mismatched

  // 3. Fix unclosed \left[ or \left( inside $...$ blocks
  return res;
}

const cleaned = cleanCorruptDelimitersAndEscapes(screenshotRawInput);
console.log('--- CLEANED ---');
console.log(cleaned);

const norm = normalizeLatexShortcuts(cleaned);
console.log('--- NORM SHORTCUTS ---');
console.log(norm);

const converted = smartConvertRaw(norm);
console.log('--- SMART CONVERT RAW ---');
console.log(converted);

const parts = converted.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
console.log('--- PARTS SPLIT ---');
console.log(parts);

parts.forEach((p, idx) => {
  if (p.startsWith('$') && p.endsWith('$') && p.length > 2) {
    let expr = p.startsWith('$$') ? p.slice(2, -2).trim() : p.slice(1, -1).trim();
    // Clean remaining double backslashes if any
    expr = expr.replace(/\\\\([a-zA-Z]+|\[|\]|\(|\))/g, '\\$1');
    const formatted = textToLaTeX(normalizeLatexExpr(expr));
    console.log(`Part ${idx} expr: "${expr}" -> formatted: "${formatted}"`);
    try {
      const html = katex.renderToString(formatted, { throwOnError: false });
      console.log(`Part ${idx} has error:`, html.includes('katex-error'));
      console.log(`Part ${idx} KaTeX HTML snippet:`, html.slice(0, 100));
    } catch (err) {
      console.log(`Part ${idx} threw error:`, err);
    }
  }
});
