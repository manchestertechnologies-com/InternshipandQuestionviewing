import katex from 'katex';
import { textToLaTeX, normalizeLatexExpr, normalizeLatexShortcuts, smartConvertRaw } from '../src/lib/mathParser';

const p1 = `Concept: For transition-metal ions, the spin-only moment is \\mu = \\sqrt[n(n + 2)] BM, where n is the number of unpaired electrons.`;
const p2 = `Write the d- or f-electron configuration of the ion after removing the outer ns electrons first. Count the unpaired electrons and, where required, use \\mu = \\sqrt[n(n + 2)] BM.`;

console.log('=== TEST PROMPT 1 ===');
const n1 = normalizeLatexShortcuts(p1);
console.log('Normalized 1:', n1);
const c1 = smartConvertRaw(n1);
console.log('SmartConverted 1:', c1);

const parts1 = c1.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
parts1.forEach((p, idx) => {
  if (p.startsWith('$') && p.endsWith('$') && p.length > 2) {
    const expr = p.slice(1, -1).trim();
    const formatted = textToLaTeX(normalizeLatexExpr(expr));
    const html = katex.renderToString(formatted, { throwOnError: false });
    console.log(`Part ${idx} MATH "$${expr}$" -> KaTeX error: ${html.includes('katex-error')}`);
  } else if (p) {
    console.log(`Part ${idx} TEXT: "${p}"`);
  }
});

console.log('=== TEST PROMPT 2 ===');
const n2 = normalizeLatexShortcuts(p2);
console.log('Normalized 2:', n2);
const c2 = smartConvertRaw(n2);
console.log('SmartConverted 2:', c2);

const parts2 = c2.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
parts2.forEach((p, idx) => {
  if (p.startsWith('$') && p.endsWith('$') && p.length > 2) {
    const expr = p.slice(1, -1).trim();
    const formatted = textToLaTeX(normalizeLatexExpr(expr));
    const html = katex.renderToString(formatted, { throwOnError: false });
    console.log(`Part ${idx} MATH "$${expr}$" -> KaTeX error: ${html.includes('katex-error')}`);
  } else if (p) {
    console.log(`Part ${idx} TEXT: "${p}"`);
  }
});
