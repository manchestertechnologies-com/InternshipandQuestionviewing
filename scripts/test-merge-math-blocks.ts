import { smartConvertRaw, normalizeLatexShortcuts } from '../src/lib/mathParser';

function mergeMathBlocks(text: string): string {
  let res = text;
  // 1. Merge "var = $Math$" -> "$var = Math$"
  res = res.replace(/\b([a-zA-Z0-9_]+)\s*(=|\\le|\\ge|\\ne|\\approx)\s*\$([^$]+)\$/g, (_m, v, op, math) => `$${v} ${op} ${math}$`);
  // 2. Merge "$Math1$ = $Math2$" -> "$Math1 = Math2$"
  res = res.replace(/\$([^$]+)\$\s*(=|\\le|\\ge|\\ne|\\approx)\s*\$([^$]+)\$/g, (_m, m1, op, m2) => `$${m1} ${op} ${m2}$`);
  // 3. Merge "$Math1 =$ $Math2$" -> "$Math1 = Math2$"
  res = res.replace(/\$([^$]+)\s*=\$\s*\$([^$]+)\$/g, (_m, m1, m2) => `$${m1} = ${m2}$`);
  // 4. Merge "$Math1$ = val + $Math2$" -> "$Math1 = val + Math2$"
  res = res.replace(/\$([^$]+)\$\s*=\s*(\d+(?:\.\d+)?)\s*([+\-*/])\s*\$([^$]+)\$/g, (_m, m1, val, op, m2) => `$${m1} = ${val} ${op} ${m2}$`);
  return res;
}

const userText = `Formula: Use M = \\chi H, B = \\mu_0(H + M), \\mu = \\mu_0(1 + \\chi), and \\mu_r = 1 + \\chi.`;

const norm = normalizeLatexShortcuts(userText);
const converted = smartConvertRaw(norm);
console.log('--- BEFORE MERGE ---');
console.log(converted);

console.log('--- AFTER MERGE ---');
const merged = mergeMathBlocks(converted);
console.log(merged);

console.log('--- PARTS SPLIT ON $ ---');
const parts = merged.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
console.log(parts);
