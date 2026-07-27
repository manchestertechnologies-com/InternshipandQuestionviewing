import { textToLaTeX, isMathExpression } from '../src/lib/mathParser';
import katex from 'katex';

function renderMixedContent(text: string): string {
  if (!text) return '';

  // 1. If text contains $...$ or \(...\) inline math delimiters
  if (/\$|\\\(/.test(text)) {
    return text.replace(/\$([^\$]+)\$|\\\((.*?)\\\)/g, (match, math1, math2) => {
      const expr = (math1 || math2 || '').trim();
      try {
        const latex = textToLaTeX(expr);
        return katex.renderToString(latex, { displayMode: false, throwOnError: false });
      } catch (e) {
        return match;
      }
    });
  }

  // 2. If text contains embedded LaTeX commands like \vec{E}, \bar{E}, \frac{...}{...}, \sqrt{...} inside text
  const embeddedMathRegex = /(\\vec\{[^{}]+\}|\\bar\{[^{}]+\}|\\overline\{[^{}]+\}|\\frac\{[^{}]+\}\{[^{}]+\}|\\sqrt\{[^{}]+\})/g;
  if (embeddedMathRegex.test(text)) {
    return text.replace(embeddedMathRegex, (match) => {
      try {
        const latex = textToLaTeX(match);
        return katex.renderToString(latex, { displayMode: false, throwOnError: false });
      } catch (e) {
        return match;
      }
    });
  }

  // 3. Standard full math expression or normal text
  if (isMathExpression(text)) {
    try {
      const latex = textToLaTeX(text);
      return katex.renderToString(latex, { displayMode: false, throwOnError: false });
    } catch (e) {
      return text;
    }
  }

  return text;
}

// Test Question 29 options from photo:
const q29Options = [
  '1/(2\\pi) \\sqrt{PE/I}',
  '\\pi \\sqrt{I/PE}',
  '\\sqrt{PE/I}',
  '2\\pi \\sqrt{I/PE}',
  'A dipole of dipole moment P and moment of inertia I is placed in a uniform electric field \\vec{E}.',
  'A dipole of dipole moment $P$ and moment of inertia $I$ is placed in a uniform electric field $\\vec{E}.$'
];

q29Options.forEach((opt, i) => {
  console.log(`Option/Text ${i + 1}:`, opt);
  console.log('HTML Output preview length:', renderMixedContent(opt).length);
  console.log('---');
});
