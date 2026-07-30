import { smartConvertRaw, normalizeLatexShortcuts } from '../src/lib/mathParser';

function cleanOptionPrefix(text: string): string {
  if (!text) return '';
  return text.replace(/^(?:\([1-4A-Da-d]\)|[1-4A-Da-d][\.\)]|Option\s+[1-4A-Da-d]:?)\s*/i, '');
}

// User screenshots 1 & 2 inputs from latest prompt:
const optA = `\\frac{1}{4\\pi\\varepsilon0}\\cdot\\frac{-q}{a^2+b^2}`;
const optB = `(3) \\frac{1}{4\\pi\\varepsilon_0}\\cdot q/\\sqrt(a^2+b^2)`;
const optC = `\\frac{1}{4\\pi\\varepsilon0}\\cdot\\frac{-q}{a^2+b^2}`;
const optD = `\\frac{1}{4\\pi\\varepsilon0}\\cdot\\frac{2q}{a^2+b^2}`;

console.log('=== OPTION A TEST ===');
console.log('Raw:', optA);
const normA = normalizeLatexShortcuts(optA);
console.log('Norm A:', normA);

console.log('=== OPTION B TEST ===');
const cleanB = cleanOptionPrefix(optB);
console.log('Raw B:', optB);
console.log('Clean B:', cleanB);
const normB = normalizeLatexShortcuts(cleanB);
console.log('Norm B:', normB);

console.log('=== OPTION D TEST ===');
console.log('Raw D:', optD);
const normD = normalizeLatexShortcuts(optD);
console.log('Norm D:', normD);
