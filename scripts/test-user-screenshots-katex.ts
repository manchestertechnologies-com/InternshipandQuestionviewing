import katex from 'katex';
import { textToLaTeX, normalizeLatexExpr, normalizeLatexShortcuts } from '../src/lib/mathParser';

const screenshot1 = `Peak voltage E_{0} = 141 V, so V_{rms} = E_0/\\sqrt 2 = \\frac{141}{\\sqrt2} \\approx 100V .
Also \\omega = 628 \\frac{rad}{s} = 2\\pi \\vec f = \\frac{628}{2\\pi} \\approx 100 Hz.
Hence V_{rms} = 100 V, f = 100 H\\vec{z} Option (3).`;

const screenshot2 = `For nth dark fringe:
x=(\\frac{n-1}{2})\\frac{x\\lambda\\times D}{d}. Next, for n=2: x=1.\\frac{5\\times\\lambda\\times D}{d}
=\\lambda=\\frac{x\\times d}{1.5\\times D}=1\\times10^{-3}\\times0.\\frac{9\\times10^{-3}}{1.5\\times1}=0.\\frac{9\\times10^{-6}}{1}.5=6\\times10^{-7}m=6\\times10^{-5} cm. This
confirms that option (D) is the correct answer.`;

console.log('--- SCREENSHOT 1 ---');
const norm1 = normalizeLatexShortcuts(screenshot1);
console.log('Norm1:\n', norm1);

console.log('--- SCREENSHOT 2 ---');
const norm2 = normalizeLatexShortcuts(screenshot2);
console.log('Norm2:\n', norm2);
