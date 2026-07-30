import { formatCleanText } from '../src/lib/pasteUtils';
import { smartConvertRaw, normalizeLatexShortcuts } from '../src/lib/mathParser';

function cleanOptionPrefix(text: string): string {
  if (!text) return '';
  return text.replace(/^(?:\([1-4A-Da-d]\)|[1-4A-Da-d][\.\)]|Option\s+[1-4A-Da-d]:?)\s*/i, '');
}

const inputA = `\\frac{1}{4\pi\\varepsilon0}\\cdot\\frac{-q}{a^2+b^2}`;
const inputB = `(3) \\frac{1}{4\pi\\varepsilon_0}\\cdot q/\\sqrt(a^2+b^2)`;
const inputC = `\\frac{1}{4\pi\\varepsilon0}\\cdot\\frac{-q}{a^2+b^2}`;
const inputD = `\\frac{1}{4\pi\\varepsilon0}\\cdot\\frac{2q}{a^2+b^2}`;

console.log('--- CLEAN OPTION PREFIX B ---');
const cleanB = cleanOptionPrefix(inputB);
console.log('Clean B:', cleanB);

console.log('--- FORMAT CLEAN TEXT A ---');
const formattedA = formatCleanText(inputA);
console.log('Formatted A:', formattedA);

console.log('--- SMART CONVERT B ---');
const smartB = smartConvertRaw(normalizeLatexShortcuts(cleanB));
console.log('Smart B:', smartB);
