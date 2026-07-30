import katex from 'katex';
import { textToLaTeX, normalizeLatexExpr, normalizeLatexShortcuts, smartConvertRaw } from '../src/lib/mathParser';

const screenshot1 = `Internal resistance: r = \\frac{E - V}{I} = \\frac{50 - 45}{4}.5 = \\frac{5}{4}.5 \\approx 1.11 \\Omega`;

const screenshot2 = `Peak voltage E_o = 141 V, so Vrms = E_o/\\sqrt2 = 141/\\sqrt2 = 100 V.
Also \\omega = 628 \\frac{rad}{s} = 2\\pi\\vec{f} f = \\frac{628}{2\\pi} \\approx 100 Hz.
Hence Vrms = 100 V, f = 100 H\\vec{z} Option (3).`;

const screenshot3 = `I_max = (\\sqrt{I_1} + \\sqrt{I_2})^2 = (\\sqrt{I} + \\sqrt{4I})^2 = (\\sqrt{I} + 2\\sqrt{I})^2 = (3\\sqrt{I})^2 = 9I . This confirms that option (B) is the correct answer.`;

console.log('=== SCREENSHOT 1 SMART CONVERT ===');
const smart1 = smartConvertRaw(screenshot1);
console.log('Smart 1:\n', smart1);

console.log('=== SCREENSHOT 2 SMART CONVERT ===');
const smart2 = smartConvertRaw(screenshot2);
console.log('Smart 2:\n', smart2);

console.log('=== SCREENSHOT 3 SMART CONVERT ===');
const smart3 = smartConvertRaw(screenshot3);
console.log('Smart 3:\n', smart3);
