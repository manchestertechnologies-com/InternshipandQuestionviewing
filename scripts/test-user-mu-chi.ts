import katex from 'katex';
import { textToLaTeX, normalizeLatexExpr, normalizeLatexShortcuts, smartConvertRaw } from '../src/lib/mathParser';

const userText = `Formula: Use M = \\chi H, B = \\mu_0(H + M), \\mu = \\mu_0(1 + \\chi), and \\mu_r = 1 + \\chi.`;

console.log('--- RAW INPUT ---');
console.log(userText);

console.log('--- NORM SHORTCUTS ---');
const norm = normalizeLatexShortcuts(userText);
console.log(norm);

console.log('--- SMART CONVERT RAW ---');
const converted = smartConvertRaw(norm);
console.log(converted);

console.log('--- PARTS SPLIT ON $ ---');
const parts = converted.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
console.log(parts);
