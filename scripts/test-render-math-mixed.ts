import katex from 'katex';
import { textToLaTeX, normalizeLatexExpr, normalizeLatexShortcuts, smartConvertRaw } from '../src/lib/mathParser';

function renderMathMixed(raw: string): string {
  if (!raw) return '';
  let out = '';
  let i = 0;
  const n = raw.length;
  while (i < n) {
    if (raw[i] === '$') {
      const isDisplay = raw[i + 1] === '$';
      const delim = isDisplay ? '$$' : '$';
      const start = i + delim.length;
      const end = raw.indexOf(delim, start);
      if (end === -1) {
        out += raw.slice(i);
        break;
      }
      const expr = raw.slice(start, end).trim();
      try {
        const normalized = normalizeLatexExpr(expr);
        const formatted = textToLaTeX(normalized);
        out += katex.renderToString(formatted, {
          throwOnError: false,
          displayMode: isDisplay,
          output: 'html',
        });
      } catch (e) {
        out += expr;
      }
      i = end + delim.length;
    } else {
      const next = raw.indexOf('$', i);
      const chunk = next === -1 ? raw.slice(i) : raw.slice(i, next);
      out += chunk;
      i = next === -1 ? n : next;
    }
  }
  return out;
}

const input1 = `Peak voltage E_o = 141 V, so Vrms = E_o/\\sqrt2 = 141/\\sqrt2 = 100 V.
Also \\omega = 628 \\frac{rad}{s} = 2\\pi\\vec{f} f = \\frac{628}{2\\pi} \\approx 100 Hz.
Hence Vrms = 100 V, f = 100 H\\vec{z} Option (3).`;

const input2 = `Internal resistance: r = \\frac{E - V}{I} = \\frac{50 - 45}{4}.5 = \\frac{5}{4}.5 \\approx 1.11 \\Omega`;

const input3 = `I_max = (\\sqrt{I_1} + \\sqrt{I_2})^2 = (\\sqrt{I} + \\sqrt{4I})^2 = (\\sqrt{I} + 2\\sqrt{I})^2 = (3\\sqrt{I})^2 = 9I . This confirms that option (B) is the correct answer.`;

console.log('--- INPUT 1 RENDERING ---');
const converted1 = smartConvertRaw(normalizeLatexShortcuts(input1));
const rendered1 = renderMathMixed(converted1);
console.log('Has dollar signs 1:', rendered1.includes('$'));
console.log('Has raw frac 1:', rendered1.includes('\\frac'));

console.log('--- INPUT 2 RENDERING ---');
const converted2 = smartConvertRaw(normalizeLatexShortcuts(input2));
const rendered2 = renderMathMixed(converted2);
console.log('Has dollar signs 2:', rendered2.includes('$'));
console.log('Has raw frac 2:', rendered2.includes('\\frac'));

console.log('--- INPUT 3 RENDERING ---');
const converted3 = smartConvertRaw(normalizeLatexShortcuts(input3));
const rendered3 = renderMathMixed(converted3);
console.log('Has dollar signs 3:', rendered3.includes('$'));
console.log('Has raw frac 3:', rendered3.includes('\\frac'));
