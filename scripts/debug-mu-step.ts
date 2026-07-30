import { normalizeLatexShortcuts, smartConvertRaw } from '../src/lib/mathParser';

let text = `Concept: For transition-metal ions, the spin-only moment is \\mu = \\sqrt[n(n + 2)] BM, where n is the number of unpaired electrons.`;

text = normalizeLatexShortcuts(text);
console.log('Step 0 (normalizeLatexShortcuts):', text);

const converted = smartConvertRaw(text);
console.log('Final smartConvertRaw:', converted);
