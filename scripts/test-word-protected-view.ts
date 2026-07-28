import { parseRichTextToUnicode, formatCleanText } from '../src/lib/pasteUtils';
import assert from 'assert';

console.log('Testing Word Protected View Clipboard HTML Parsing...');

// Exact Word Protected View HTML clipboard output structure
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
<p class=MsoNormal><span style='font-family:"Cambria Math",serif'>(a) P</span></p>
<p class=MsoNormal><span style='font-family:"Cambria Math",serif'>(b) Q</span></p>
<p class=MsoNormal><span style='font-family:"Cambria Math",serif'>(c) R</span></p>
<p class=MsoNormal><span style='font-family:"Cambria Math",serif'>(d) S</span></p>
</body>
</html>
`;

const plainTextFallback = `1. The electronic configuration of four atoms are given in brackets :
P(1s²2s²2p¹); Q(1s²2s²2p⁵)
R(1s²2s²2p⁶3s¹); S(1s²2s²2p²)
The element that would most readily form a diatomic molecule is
(a) P
(b) Q
(c) R
(d) S`;

const result = parseRichTextToUnicode(wordProtectedViewHtml);
console.log('Parsed HTML Result:\n', result);

assert.strictEqual(result.includes('P(1s²2s²2p¹)'), true, 'Expected P equation from Protected View HTML');
assert.strictEqual(result.includes('Q(1s²2s²2p⁵)'), true, 'Expected Q equation from Protected View HTML');
assert.strictEqual(result.includes('R(1s²2s²2p⁶3s¹)'), true, 'Expected R equation from Protected View HTML');
assert.strictEqual(result.includes('S(1s²2s²2p²)'), true, 'Expected S equation from Protected View HTML');
assert.strictEqual(result.includes('(a) P'), true, 'Expected Option (a)');

console.log('✅ PROTECTED VIEW WORD HTML PARSING PASSED!');
