import katex from 'katex';
import { textToLaTeX, normalizeLatexExpr, normalizeLatexShortcuts, smartConvertRaw } from '../src/lib/mathParser';

// Input with exact newlines from user's screenshot:
const screenshotInput = `Concept: Transition elements generally have the electronic configuration
$$\\left[
\\left(n-1\\right)d^{1-10}ns^{0-2},
\\right]$
with known stability-based exceptions.`;

console.log('--- ORIGINAL MULTILINE SCREENSHOT INPUT ---');
console.log(screenshotInput);

function normalizeMultilineMath(text: string): string {
  let res = text;
  // 1. Unescape double backslashes
  res = res.replace(/\\{2,}([a-zA-Z]+|\[|\]|\(|\)|_|\^)/g, '\\$1');

  // 2. Fix mismatched delimiters $$ ... $ or $ ... $$ across newlines
  res = res.replace(/\$\$([\s\S]+?)\$/g, (_m, inner) => inner.includes('$$') ? _m : '$' + inner + '$');
  res = res.replace(/\$([\s\S]+?)\$\$/g, (_m, inner) => inner.includes('$$') ? _m : '$' + inner + '$');

  // 3. Collapse newlines inside $...$ math blocks so MathRenderer line-by-line split keeps math blocks intact
  res = res.replace(/\$([^$\n]*?\n[^$]*?)\$/g, (_m, inner) => '$' + inner.replace(/\r?\n/g, ' ') + '$');

  return res;
}

const norm = normalizeMultilineMath(normalizeLatexShortcuts(screenshotInput));
console.log('--- NORMALIZED MULTILINE ---');
console.log(norm);

const converted = smartConvertRaw(norm);
console.log('--- SMART CONVERTED RAW ---');
console.log(converted);

const lines = converted.split('\n');
lines.forEach((line, lIdx) => {
  console.log(`Line ${lIdx}: "${line}"`);
  const parts = line.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
  parts.forEach((p, pIdx) => {
    if (p.startsWith('$') && p.endsWith('$') && p.length > 2) {
      const expr = p.slice(1, -1).trim();
      const formatted = textToLaTeX(normalizeLatexExpr(expr));
      try {
        const html = katex.renderToString(formatted, { throwOnError: false });
        console.log(`  Part ${pIdx} math expr: "${expr}" -> KaTeX error: ${html.includes('katex-error')}`);
      } catch (err) {
        console.log(`  Part ${pIdx} math expr: "${expr}" -> threw error: ${err}`);
      }
    } else if (p) {
      console.log(`  Part ${pIdx} plain text: "${p}"`);
    }
  });
});
