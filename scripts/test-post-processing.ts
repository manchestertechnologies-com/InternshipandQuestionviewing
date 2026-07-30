export function normalizePostProcessing(text: string): string {
  if (!text) return '';
  let res = text;

  // 1. Unwrap nested \text{\text{...}} and \text{...} in plain text
  while (/\\text\{\s*\\text\{/g.test(res)) {
    res = res.replace(/\\text\{\s*\\text\{([^{}]*)\}\s*\}/g, '\\text{$1}');
  }

  // 2. Remove duplicate $$ ... $$ block delimiters if inline: $$\omega$$ -> $\omega$
  res = res.replace(/\$\$\s*([^$\n]+?)\s*\$\$/g, (_m, inner) => '$' + inner + '$');

  // 3. Remove nested $ ... $ inside LaTeX commands: \frac{$a$}{$b$} -> \frac{a}{b}
  res = res.replace(/\\(frac|sqrt|text|vec|hat|bar)\{([^{}]*?)\$([^{}]*?)\$([^{}]*?)\}/g, '\\$1{$2$3$4}');
  res = res.replace(/\\frac\{([^{}]*?)\$([^{}]*?)\$([^{}]*?)\}\{([^{}]*?)\$([^{}]*?)\$([^{}]*?)\}/g, '\\frac{$1$2$3}{$4$5$6}');

  // 4. Strip \text{...} commands outside $...$ math blocks to clean plain text
  const parts = res.split(/(\$[^$\n]+\$|\$\$[\s\S]*?\$\$)/g);
  res = parts.map(p => {
    if (p.startsWith('$')) return p;
    let clean = p;
    while (/\\text\{/g.test(clean)) {
      clean = clean.replace(/\\text\{([^{}]*)\}/g, '$1');
    }
    return clean;
  }).join('');

  // 5. Stack-based balancer for unmatched braces and parens
  res = balanceDelimiters(res);

  return res;
}

export function balanceDelimiters(str: string): string {
  let s = str;
  // Balance dollar signs
  const dollarCount = (s.match(/(?<!\\)\$/g) || []).length;
  if (dollarCount % 2 !== 0) {
    s += '$';
  }
  // Balance curly braces {} per math block / line
  const lines = s.split('\n');
  const balancedLines = lines.map(line => {
    let openBraces = 0;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '{' && (i === 0 || line[i-1] !== '\\')) openBraces++;
      else if (line[i] === '}' && (i === 0 || line[i-1] !== '\\')) openBraces = Math.max(0, openBraces - 1);
    }
    return line + '}'.repeat(openBraces);
  });
  return balancedLines.join('\n');
}

const t3 = `$$\\omega$$`;
console.log('T3 fixed:', normalizePostProcessing(t3));
