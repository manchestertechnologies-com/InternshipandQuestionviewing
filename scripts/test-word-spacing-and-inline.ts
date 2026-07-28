import { parseRichTextToUnicode, formatCleanText } from '../src/lib/pasteUtils';
import { textToLaTeX } from '../src/lib/mathParser';
import assert from 'assert';

console.log('Testing Word Spacing Collapse & Inline Rendering...');

const wordProtectedViewHtml = `
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:m="http://schemas.microsoft.com/office/2004/12/omml">
<body>
<p class=MsoNormal><span style='font-family:"Cambria Math",serif'>1. The electronic configuration of four atoms are given in brackets :</span></p>
<p class=MsoEquation align=center style='text-align:center'><!--[if gte mso 9]><xml>
 <m:oMathPara>
  <m:oMath>
   <m:r>
    <m:t>P(1s²2s²2p¹); Q(1s²2s²2p⁵)</m:t>
   </m:r>
  </m:oMath>
 </m:oMathPara>
</xml><![endif]--><![if !msEquation]><span style='font-size:11.0pt;font-family:
"Cambria Math",serif'><img width=164 height=19 src="clip_image001.png"></span><![endif]></p>
<p class=MsoEquation align=center style='text-align:center'><!--[if gte mso 9]><xml>
 <m:oMathPara>
  <m:oMath>
   <m:r>
    <m:t>R(1s²2s²2p⁶3s¹); S(1s²2s²2p²)</m:t>
   </m:r>
  </m:oMath>
 </m:oMathPara>
</xml><![endif]--><![if !msEquation]><span style='font-size:11.0pt;font-family:
"Cambria Math",serif'><img width=164 height=19 src="clip_image002.png"></span><![endif]></p>
<p class=MsoNormal><span style='font-family:"Cambria Math",serif'>The element that would most readily form a diatomic molecule is</span></p>
</body>
</html>
`;

const parsed = parseRichTextToUnicode(wordProtectedViewHtml);
console.log('Raw Parsed:\n', JSON.stringify(parsed));

// Clean up 3 or more consecutive newlines and empty whitespace lines
function normalizeNewlines(text: string): string {
  if (!text) return '';
  return text
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const cleaned = normalizeNewlines(parsed);
console.log('Cleaned Result:\n', cleaned);

const lineCount = cleaned.split('\n').filter(l => l.length > 0).length;
console.log('Line count:', lineCount);

assert.strictEqual(/\n{3,}/.test(cleaned), false, 'No 3+ consecutive newlines allowed');
assert.strictEqual(cleaned.includes('P(1s²2s²2p¹)'), true, 'Contains P equation');

console.log('✅ WORD SPACING COLLAPSE TEST PASSED!');
