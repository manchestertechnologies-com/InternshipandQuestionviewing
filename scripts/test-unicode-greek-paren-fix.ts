import katex from 'katex';
import { textToLaTeX, normalizeLatexExpr, normalizeLatexShortcuts, smartConvertRaw } from '../src/lib/mathParser';

function normalizeUnicodeGreek(text: string): string {
  let res = text;
  res = res
    .replace(/α/g, '\\alpha ')
    .replace(/β/g, '\\beta ')
    .replace(/γ/g, '\\gamma ')
    .replace(/δ/g, '\\delta ')
    .replace(/ε/g, '\\epsilon ')
    .replace(/θ/g, '\\theta ')
    .replace(/λ/g, '\\lambda ')
    .replace(/μ/g, '\\mu ')
    .replace(/π/g, '\\pi ')
    .replace(/σ/g, '\\sigma ')
    .replace(/[ϕφ]/g, '\\phi ')
    .replace(/χ/g, '\\chi ')
    .replace(/ω/g, '\\omega ')
    .replace(/Δ/g, '\\Delta ')
    .replace(/Ω/g, '\\Omega ');
  // Clean up space before subscript: e.g. \mu _0 -> \mu_0, \chi _1 -> \chi_1
  res = res.replace(/\\(alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|phi|chi|omega|Delta|Omega)\s+(_|\^|\{|\d)/g, '\\$1$2');
  return res;
}

const userInput = `Formula: Use M = χH, B = μ₀(H + M), μ = μ₀(1 + χ), and μ_r = 1 + χ.`;

console.log('--- RAW UNICODE INPUT ---');
console.log(userInput);

const normalizedGreek = normalizeUnicodeGreek(userInput);
console.log('--- NORMALIZED GREEK ---');
console.log(normalizedGreek);

const normShortcuts = normalizeLatexShortcuts(normalizedGreek);
console.log('--- NORM SHORTCUTS ---');
console.log(normShortcuts);

const smartConverted = smartConvertRaw(normShortcuts);
console.log('--- SMART CONVERTED RAW ---');
console.log(smartConverted);

const parts = smartConverted.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
console.log('--- PARTS ---');
console.log(parts);
