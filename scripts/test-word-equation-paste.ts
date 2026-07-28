import { parseRichTextToUnicode, formatCleanText } from '../src/lib/pasteUtils';
import { textToLaTeX } from '../src/lib/mathParser';
import katex from 'katex';
import assert from 'assert';

console.log('Testing Word Equation Paste Parsing...');

const wordHtmlSample = `
<p class=MsoNormal>The electronic configuration of four atoms are given in brackets :</p>
<p class=MsoEquation>
  <m:oMathPara>
    <m:oMath>
      <m:r><m:t>P(1s²2s²2p¹); Q(1s²2s²2p⁵)</m:t></m:r>
    </m:oMath>
  </m:oMathPara>
</p>
<p class=MsoEquation>
  <m:oMathPara>
    <m:oMath>
      <m:r><m:t>R(1s²2s²2p⁶3s¹); S(1s²2s²2p²)</m:t></m:r>
    </m:oMath>
  </m:oMathPara>
</p>
<p class=MsoNormal>The element that would most readily form a diatomic molecule is</p>
`;

const result = parseRichTextToUnicode(wordHtmlSample);
const formatted = formatCleanText(result);

assert.strictEqual(formatted.includes('P(1s²2s²2p¹)'), true, 'Expected P equation formatted');
assert.strictEqual(formatted.includes('Q(1s²2s²2p⁵)'), true, 'Expected Q equation formatted');
assert.strictEqual(formatted.includes('R(1s²2s²2p⁶3s¹)'), true, 'Expected R equation formatted');
assert.strictEqual(formatted.includes('S(1s²2s²2p²)'), true, 'Expected S equation formatted');
assert.strictEqual(formatted.includes('The element that would most readily form a diatomic molecule is'), true, 'Expected ending text present');

const latex = textToLaTeX(formatted);
const html = katex.renderToString(latex, { throwOnError: false });
assert.strictEqual(html.includes('katex'), true, 'Expected valid KaTeX HTML output');

console.log('✅ WORD EQUATION PASTE & KATEX PARSING PASSED!');
