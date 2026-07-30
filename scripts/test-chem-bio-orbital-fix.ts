import katex from 'katex';
import { textToLaTeX, normalizeLatexExpr, normalizeLatexShortcuts, smartConvertRaw } from '../src/lib/mathParser';

function convertChemOrbitalCarets(text: string): string {
  let res = text;
  // Convert caret ranges and expressions: e.g. d^(1-10) -> d^{1-10}, ns^(1-2) -> ns^{1-2}, d^1-10 -> d^{1-10}
  res = res.replace(/([a-zA-Z0-9_\)\}\]])\^\(?(\d+[\-–—]\d+|\d+)\)?/g, '$1^{$2}');
  return res;
}

const input1 = `(1) (n-1)d^(1-5)`;
const input2 = `(2) (n-1)d^(1-10) ns^1`;
const input3 = `(3) (n-1)d^(1-10) ns^(1-2)`;
const input4 = `Concept: Transition elements generally have (n-1)d^(1-10) ns^(0-2) configurations, with known stability-based exceptions.`;
const input5 = `Hardy-Weinberg: p^2 + 2pq + q^2 = 1 and p + q = 1`;

console.log('=== INPUT 1 ===');
const c1 = convertChemOrbitalCarets(normalizeLatexShortcuts(input1));
console.log('Converted 1:', smartConvertRaw(c1));

console.log('=== INPUT 2 ===');
const c2 = convertChemOrbitalCarets(normalizeLatexShortcuts(input2));
console.log('Converted 2:', smartConvertRaw(c2));

console.log('=== INPUT 3 ===');
const c3 = convertChemOrbitalCarets(normalizeLatexShortcuts(input3));
console.log('Converted 3:', smartConvertRaw(c3));

console.log('=== INPUT 4 ===');
const c4 = convertChemOrbitalCarets(normalizeLatexShortcuts(input4));
console.log('Converted 4:', smartConvertRaw(c4));

console.log('=== INPUT 5 ===');
const c5 = convertChemOrbitalCarets(normalizeLatexShortcuts(input5));
console.log('Converted 5:', smartConvertRaw(c5));
