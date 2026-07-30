import katex from 'katex';
import { textToLaTeX, normalizeLatexExpr, normalizeLatexShortcuts } from '../src/lib/mathParser';

function cleanOcrFractions(text: string): string {
  let res = text;
  // 1. Convert OCR fraction typos: 1.\frac{5\times\lambda\times D}{d} -> 1.5 \times \frac{\lambda \times D}{d}
  res = res.replace(/(\d+)\.\s*\\frac\{(\d+)([^}]*)\}/g, '$1.$2 \\times \\frac{$3}');
  // 2. Convert trailing decimal fractions: \frac{...}{1}.5 -> \frac{...}{1} \times 0.5
  res = res.replace(/(\\frac\{[^{}]*\}\{[^{}]*\})\s*\.\s*(\d+)/g, '$1 \\times 0.$2');
  // 3. Convert multi-letter words before \vec: H\vec{z} -> H \vec{z}
  res = res.replace(/([a-zA-Z]{2,})\\vec\{([a-zA-Z]+)\}/g, '$1 \\vec{$2}');
  // 4. Convert multi-letter words inside \frac{rad}{s} -> \frac{\text{rad}}{\text{s}}
  res = res.replace(/\\frac\{([a-zA-Z]{2,})\}\{([a-zA-Z]{1,2})\}/g, '\\frac{\\text{$1}}{\\text{$2}}');
  return res;
}

const screenshot1 = `Peak voltage E_{0} = 141 V, so V_{rms} = E_0/\\sqrt 2 = \\frac{141}{\\sqrt2} \\approx 100V .
Also \\omega = 628 \\frac{rad}{s} = 2\\pi \\vec f = \\frac{628}{2\\pi} \\approx 100 Hz.
Hence V_{rms} = 100 V, f = 100 H\\vec{z} Option (3).`;

const screenshot2 = `For nth dark fringe:
x=(\\frac{n-1}{2})\\frac{x\\lambda\\times D}{d}. Next, for n=2: x=1.\\frac{5\\times\\lambda\\times D}{d}
=\\lambda=\\frac{x\\times d}{1.5\\times D}=1\\times10^{-3}\\times0.\\frac{9\\times10^{-3}}{1.5\\times1}=0.\\frac{9\\times10^{-6}}{1}.5=6\\times10^{-7}m=6\\times10^{-5} cm. This
confirms that option (D) is the correct answer.`;

console.log('=== SCREENSHOT 1 CLEANED ===');
const cleaned1 = cleanOcrFractions(normalizeLatexShortcuts(screenshot1));
console.log(cleaned1);
const html1 = katex.renderToString(textToLaTeX(cleaned1), { throwOnError: false });
console.log('Has KaTeX Error 1:', html1.includes('katex-error'));

console.log('=== SCREENSHOT 2 CLEANED ===');
const cleaned2 = cleanOcrFractions(normalizeLatexShortcuts(screenshot2));
console.log(cleaned2);
const html2 = katex.renderToString(textToLaTeX(cleaned2), { throwOnError: false });
console.log('Has KaTeX Error 2:', html2.includes('katex-error'));
