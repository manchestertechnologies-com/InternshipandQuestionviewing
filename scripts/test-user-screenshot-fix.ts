import { formatCleanText, autoFormatIonicChargesAndChemistry } from '../src/lib/pasteUtils';
import { normalizeLatexShortcuts, smartConvertRaw } from '../src/lib/mathParser';

console.log('=== TEST SCREENSHOT INPUTS ===');

const line1 = `34. Amongst TiF₆ ^(2-),CoF₆^(3-),Cu^(2-) Cl and NiCl₄^(2-) (At. No. Ti = 22, Co=27,Cu=29,Ni=28 ), the colourless species are`;
const line2 = `(1) TiF₆ ^(2-) and Cu₂ Cl₂`;
const line3 = `(2) Cu₂ Cl₂ and NiCl₄^2`;
const line4 = `(3) TiF₆ ^(2-) and CoF₆^(3-)`;
const line5 = `(4) CoF₆^(3-) and NiCl₄^(2-)`;
const line6 = `Correct Answer: Cannot be determined accurately — source text/options are merged or unreadable`;

console.log('1. AUTO CHEM FIX:');
console.log('Line 1:', formatCleanText(line1));
console.log('Line 2:', formatCleanText(line2));
console.log('Line 3:', formatCleanText(line3));
console.log('Line 4:', formatCleanText(line4));
console.log('Line 5:', formatCleanText(line5));

console.log('\n2. LIVE PREVIEW RENDER (smartConvertRaw):');
console.log('Line 1:', smartConvertRaw(normalizeLatexShortcuts(line1)));
console.log('Line 2:', smartConvertRaw(normalizeLatexShortcuts(line2)));
console.log('Line 3:', smartConvertRaw(normalizeLatexShortcuts(line3)));
console.log('Line 4:', smartConvertRaw(normalizeLatexShortcuts(line4)));
console.log('Line 5:', smartConvertRaw(normalizeLatexShortcuts(line5)));
console.log('Line 6:', smartConvertRaw(normalizeLatexShortcuts(line6)));
