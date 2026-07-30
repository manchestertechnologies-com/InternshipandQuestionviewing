import { formatCleanText } from '../src/lib/pasteUtils';
import { smartConvertRaw, normalizeLatexShortcuts } from '../src/lib/mathParser';

// Test input from user screenshot 1:
const optionA = `\\frac{1}{4\pi\varepsilon0}\cdot\\frac{-q}{a^2+b^2}`;
const optionB = `(3) \\frac{1}{4\pi\varepsilon_0}\cdot q/\\sqrt(a^2+b^2)`;
const optionD = `\\frac{1}{4\pi\varepsilon0}\cdot\\frac{2q}{a^2+b^2}`;

console.log('=== OPTION A ===');
const normA = normalizeLatexShortcuts(optionA);
const smartA = smartConvertRaw(normA);
console.log('Raw:', optionA);
console.log('Smart converted A:', smartA);

console.log('=== OPTION B ===');
const normB = normalizeLatexShortcuts(optionB);
const smartB = smartConvertRaw(normB);
console.log('Raw:', optionB);
console.log('Smart converted B:', smartB);

console.log('=== OPTION D ===');
const normD = normalizeLatexShortcuts(optionD);
const smartD = smartConvertRaw(normD);
console.log('Raw:', optionD);
console.log('Smart converted D:', smartD);
