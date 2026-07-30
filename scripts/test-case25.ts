import { normalizeLatexShortcuts, smartConvertRaw } from '../src/lib/mathParser';

const input = `Magnetic Susceptibility: M = \\chi H, B = \\mu_0(H + M)`;
console.log('INPUT:', input);
console.log('NORM:', normalizeLatexShortcuts(input));
console.log('CONV:', smartConvertRaw(normalizeLatexShortcuts(input)));
