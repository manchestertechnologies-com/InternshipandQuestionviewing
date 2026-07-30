/**
 * Core Mathematical Parser and LaTeX Converter.
 * Converts plain text, ASCII math, and Unicode equations into high-quality LaTeX for KaTeX rendering.
 */

// Helper to strip balanced outer parentheses
export function stripOuterParens(str: string): string {
  let s = str.trim();
  while (s.startsWith('(') && s.endsWith(')')) {
    let depth = 0;
    let isOuter = true;
    for (let i = 0; i < s.length - 1; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') depth--;
      if (depth === 0 && i > 0) { isOuter = false; break; }
    }
    if (isOuter) s = s.slice(1, -1).trim();
    else break;
  }
  return s;
}

/**
 * Normalizes raw expressions with literal math symbols (√, ×, ÷, °, ″, ′, etc.)
 * into valid KaTeX commands so rendering won't throw unrecognized unicode errors.
 */
export function normalizeLatexExpr(expr: string): string {
  if (!expr) return '';
  let res = expr;
  // 1. Convert OCR fraction typos: 1.\frac{5\times\lambda\times D}{d} -> 1.5 \times \frac{\lambda \times D}{d}
  res = res.replace(/(\d+)\.\s*\\frac\{(\d+)([^}]*)\}/g, '$1.$2 \\times \\frac{$3}');
  // 2. Convert trailing decimal fractions: \frac{...}{1}.5 -> \frac{...}{1} \times 0.5
  res = res.replace(/(\\frac\{[^{}]*\}\{[^{}]*\})\s*\.\s*(\d+)/g, '$1 \\times 0.$2');
  // 3. Convert multi-letter words before \vec: H\vec{z} -> H \vec{z}
  res = res.replace(/([a-zA-Z]{2,})\\vec\{([a-zA-Z]+)\}/g, '$1 \\vec{$2}');
  // 4. Convert multi-letter words inside \frac{rad}{s} -> \frac{\text{rad}}{\text{s}}
  res = res.replace(/\\frac\{([a-zA-Z]{2,})\}\{([a-zA-Z]{1,2})\}/g, '\\frac{\\text{$1}}{\\text{$2}}');

  res = res.replace(/√\s*\(([^()]+)\)/g, '\\sqrt{$1}');
  res = res.replace(/√\s*([0-9]+(?:\.[0-9]+)?|[a-zA-Z]+)/g, '\\sqrt{$1}');
  res = res.replace(/√/g, '\\surd ');
  res = res
    .replace(/×/g, ' \\times ')
    .replace(/÷/g, ' \\div ')
    .replace(/°/g, '^{\\circ}')
    .replace(/″/g, "''")
    .replace(/′/g, "'");
  return res;
}

/**
 * Normalizes common LaTeX physics/math shorthand typos and shortcuts.
 * e.g. \wt -> \omega t, \w -> \omega, \D -> \Delta, sin -> \sin, \sqrt2 -> \sqrt{2}
 */
export function normalizeLatexShortcuts(text: string): string {
  if (!text) return '';
  let res = text;

  // Unescape double backslashes before LaTeX commands: \\left -> \left, \\right -> \right, \\frac -> \frac, etc.
  res = res.replace(/\\{2,}([a-zA-Z]+|\[|\]|\(|\)|_|\^)/g, '\\$1');

  // Fix mismatched block delimiters across newlines: e.g. $$\left[\n...\n\right]$ -> $\left[...\right]$
  res = res.replace(/\$\$([\s\S]+?)\$/g, (_m, inner) => inner.includes('$$') ? _m : '$' + inner + '$');
  res = res.replace(/\$([\s\S]+?)\$\$/g, (_m, inner) => inner.includes('$$') ? _m : '$' + inner + '$');

  // Collapse internal newlines within $...$ math blocks so MathRenderer line-by-line split keeps math blocks intact
  res = res.replace(/\$([^$\n]*?\r?\n[^$]*?)\$/g, (_m, inner) => '$' + inner.replace(/\r?\n/g, ' ') + '$');

  // Normalize direct Unicode Greek letters to LaTeX commands
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
  // Clean up space after Greek commands ONLY before subscripts/superscripts/braces/digits (e.g. \mu _0 -> \mu_0, \chi _1 -> \chi_1)
  res = res.replace(/\\(alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|phi|chi|omega|Delta|Omega)\s+(_|\^|\{|\d)/g, '\\$1$2');
  // Ensure single clean space around equality for Greek variables (\mu= -> \mu = )
  res = res.replace(/\\(alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|phi|chi|omega|Delta|Omega)\s*=\s*/g, (m, g) => `\\${g} = `);

  res = res.replace(/\\wt(?![a-zA-Z])/g, '\\omega t');
  res = res.replace(/\\w(?![a-zA-Z])/g, '\\omega');
  res = res.replace(/\\D(?![a-zA-Z])/g, '\\Delta');
  res = res.replace(/\\a(?![a-zA-Z])/g, '\\alpha');
  res = res.replace(/\\b(?![a-zA-Z])/g, '\\beta');
  res = res.replace(/\\th(?![a-zA-Z])/g, '\\theta');
  res = res.replace(/\\l(?![a-zA-Z])/g, '\\lambda');
  res = res.replace(/\\p(?![a-zA-Z])/g, '\\pi');
  res = res.replace(/\\s(?![a-zA-Z])/g, '\\sigma');
  // Physics shorthand helpers
  res = res.replace(/\bVrms\b/gi, 'V_{\\text{rms}}');
  res = res.replace(/\bIrms\b/gi, 'I_{\\text{rms}}');
  res = res.replace(/\bErms\b/gi, 'E_{\\text{rms}}');
  res = res.replace(/(?<!\\)\bE0\b/g, 'E_0');
  res = res.replace(/(?<!\\)\bI0\b/g, 'I_0');
  res = res.replace(/(?<!\\)\bV0\b/g, 'V_0');
  res = res.replace(/\\(varepsilon|epsilon)0\b/g, '\\$1_{0}');
  // Greek words with subscripts (e.g. mu0 -> \mu_0, lambda1 -> \lambda_1, theta2 -> \theta_2)
  res = res.replace(/(?<![\\a-zA-Z])\b(alpha|beta|gamma|theta|lambda|omega|pi|mu|sigma|phi|delta|epsilon)(\d+)\b/gi, (m, g, num) => `\\${g.toLowerCase()}_{${num}}`);
  // Standalone Greek words typed without backslash (e.g. alpha -> \alpha, theta -> \theta, omega -> \omega)
  res = res.replace(/(?<![\\a-zA-Z])\b(alpha|beta|gamma|theta|lambda|omega|pi|mu|sigma|phi|delta|epsilon)\b(?![a-zA-Z])/gi, (m, g) => `\\${g.toLowerCase()}`);
  // Roots: root(n, expr) -> \sqrt[n]{expr}, sqrt(expr) -> \sqrt{expr}, \sqrt[expr] (without {}) -> \sqrt{expr}
  res = res.replace(/\broot\((\d+),\s*(.+?)\)/gi, '\\sqrt[$1]{$2}');
  res = res.replace(/\bsqrt\((.+?)\)/gi, '\\sqrt{$1}');
  res = res.replace(/\\sqrt\[([^\]]+)\](?!\s*\{)/g, '\\sqrt{$1}');
  // Operators: <= -> \le, >= -> \ge, != -> \ne, +- -> \pm
  res = res.replace(/<=/g, '\\le ');
  res = res.replace(/>=/g, '\\ge ');
  res = res.replace(/!=/g, '\\ne ');
  res = res.replace(/\+-/g, '\\pm ');
  // Handle \sqrt followed directly by digit/letter (e.g. \sqrt2 -> \sqrt{2})
  res = res.replace(/\\sqrt\s*([0-9a-zA-Z])(?![a-zA-Z0-9_{}])/g, '\\sqrt{$1}');
  // Convert caret range exponents for Chemistry orbitals (e.g. d^(1-10) -> d^{1-10}, d^(1-5) -> d^{1-5}, ns^(1-2) -> ns^{1-2}, ns^(0-2) -> ns^{0-2})
  res = res.replace(/([a-zA-Z0-9_\)\}\]])\^\(?(\d+[\-–—]\d+)\)?/g, '$1^{$2}');

  // Vector arrows & unit hats: e.g. \vec E -> \vec{E}, \hat i -> \hat{i}, r ⃗ -> \vec{r}, i ˆ -> \hat{i}, E ⃗ -> \vec{E}
  res = res.replace(/\\vec\s*([a-zA-Z0-9])(?![a-zA-Z0-9_{}])/g, '\\vec{$1}');
  res = res.replace(/\\hat\s*([a-zA-Z0-9])(?![a-zA-Z0-9_{}])/g, '\\hat{$1}');
  res = res.replace(/\\bar\s*([a-zA-Z0-9])(?![a-zA-Z0-9_{}])/g, '\\bar{$1}');
  res = res.replace(/([a-zA-Z0-9])\s*[\u20D7\u20D6\u20D1\u20D0\u20E1\u2192]/g, '\\vec{$1}');
  res = res.replace(/([a-zA-Z0-9])\s*[\u02C6\u0302\u0306\u030a]/g, '\\hat{$1}');
  // Auto-prefix trig and math function names with backslash if missing (e.g. sin(\omega t) -> \sin(\omega t))
  res = res.replace(/(?<!\\)\b(sin|cos|tan|cot|sec|csc|log|ln|exp|lim)\b/g, '\\$1');
  // Format Option labels in math expressions cleanly
  res = res.replace(/\b(Option|Choice|Part|Section)\s*(\([0-9a-zA-Z]+\)|[0-9a-zA-Z]+)/gi, '\\text{$1 $2}');
  return res;
}

/**
 * Checks if a matched A / B string is an English "or" text slash rather than a mathematical fraction.
 */
export function isEnglishOrSlash(numStr: string, denStr: string, fullStr: string, offset: number, match: string): boolean {
  const numClean = stripOuterParens(numStr).trim();
  const denClean = stripOuterParens(denStr).trim();

  // 1. URL check
  const checkContext = fullStr.substring(Math.max(0, offset - 15), Math.min(fullStr.length, offset + match.length + 15));
  if (/https?:\/\//i.test(checkContext) || /www\./i.test(checkContext)) {
    return true;
  }

  // 2. Date check (e.g. 12/05/2026, 1/2/2024)
  if (/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(match) || (/\b\d{1,2}\/\d{1,2}\b/.test(checkContext) && /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(checkContext))) {
    return true;
  }

  // 3. Known English text options & slash pairs, and non-math physical unit rates (case-insensitive)
  const knownTextSlashPairs = new Set([
    'and/or', 'true/false', 'yes/no', 'input/output', 'pass/fail', 'male/female',
    'either/or', 'on/off', 'in/out', 'up/down', 'left/right', 'high/low',
    'top/bottom', 'front/back', 'increase/decrease', 'positive/negative',
    'acid/base', 'day/night', 'correct/incorrect', 'even/odd', 'real/imaginary',
    'open/closed', 'before/after', 'start/stop', 'win/loss', 'read/write',
    'import/export', 'buy/sell', 'push/pull', 'plus/minus', 'north/south', 'east/west',
    'or', 'and or',
    'km/h', 'km/hr', 'm/s', 'kg/s', 'cm/s', 'ft/s', 'mi/h', 'mph', 'rad/s', 'g/l', 'mg/ml', 'g/ml'
  ]);
  const pairLower = `${numClean.toLowerCase()}/${denClean.toLowerCase()}`;
  if (knownTextSlashPairs.has(pairLower)) {
    return true;
  }

  // 4. Option or Section headers (e.g., Option A/B, Choice A/B, Part A/B, Section A/B)
  if (/^(Option|Choice|Part|Section|Q|Question|Page)\s+[A-Z0-9]+$/i.test(numClean) || /^(Option|Choice|Part|Section)\s*$/i.test(fullStr.substring(Math.max(0, offset - 10), offset))) {
    return true;
  }
  if (/^[A-Z]$/.test(numClean) && /^[A-Z]$/.test(denClean) && /\b(Option|Choice|Part|Section|select|answer)\b/i.test(fullStr.substring(Math.max(0, offset - 20), offset))) {
    return true;
  }

  // 5. Check if both sides are multi-letter pure English words (>= 2 letters) with NO math symbols/digits/functions
  const isPureWord = (s: string) => /^[a-zA-Z]{2,}$/.test(s);
  const mathFunctions = new Set([
    'sin', 'cos', 'tan', 'cot', 'sec', 'csc', 'sinh', 'cosh', 'tanh',
    'log', 'ln', 'exp', 'lim', 'det', 'max', 'min', 'gcd', 'lcm',
    'arcsin', 'arccos', 'arctan'
  ]);
  const physicsQuantities = new Set([
    'distance', 'time', 'mass', 'volume', 'work', 'force', 'area',
    'change', 'velocity', 'speed', 'length', 'width', 'height', 'radius',
    'charge', 'energy', 'power', 'voltage', 'current', 'pressure',
    'temperature', 'density', 'frequency', 'wavelength'
  ]);

  if (isPureWord(numClean) && isPureWord(denClean)) {
    const numLow = numClean.toLowerCase();
    const denLow = denClean.toLowerCase();

    if (mathFunctions.has(numLow) || mathFunctions.has(denLow)) return false;
    if (physicsQuantities.has(numLow) || physicsQuantities.has(denLow)) return false;

    return true;
  }

  return false;
}

/**
 * Normalizes Unicode math symbols to standard LaTeX expressions.
 */
export function normalizeUnicodeSymbols(text: string): string {
  if (!text) return '';
  let res = text;

  // Minus and Dash characters
  res = res.replace(/[\u2212\u2010-\u2015]/g, '-');

  // Integrals with bounds: e.g. ∫₀¹x²dx -> \int_{0}^{1} x^2 \, dx
  res = res.replace(/∫([₀₁₂₃₄₅₆₇₈₉0-9a-zA-Z]*)([⁰¹²³⁴⁵⁶⁷⁸⁹0-9a-zA-Z]*)/g, (match, sub, sup) => {
    // Only capture Unicode subscript characters or short bound digits/letters
    let subDigits = '';
    let restSub = sub;
    const subMatch = sub.match(/^([₀₁₂₃₄₅₆₇₈₉]+)/);
    if (subMatch) {
      subDigits = subMatch[1].replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (d: string) => '0123456789'['₀₁₂₃₄₅₆₇₈₉'.indexOf(d)]);
      restSub = sub.slice(subMatch[1].length);
    }

    let supDigits = '';
    let restSup = sup;
    const supMatch = sup.match(/^([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/);
    if (supMatch) {
      supDigits = supMatch[1].replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d: string) => '0123456789'['⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(d)]);
      restSup = sup.slice(supMatch[1].length);
    }

    if (subDigits || supDigits) {
      let out = '\\int';
      if (subDigits) out += `_{${subDigits}}`;
      if (supDigits) out += `^{${supDigits}}`;
      return out + ' ' + restSub + restSup;
    }

    return '\\int ';
  });

  // Summations with bounds: e.g. ∑ᵢ₌₁ⁿi² -> \sum_{i=1}^{n} i^2
  res = res.replace(/∑([ᵢ₌₁₂₃₄₅₆₇₈₉0-9a-zA-Z=_-]*)([ⁿ⁰¹²³⁴⁵⁶⁷⁸⁹0-9a-zA-Z]*)/g, (match, sub, sup) => {
    let subStr = '';
    let restSub = sub;
    const subMatch = sub.match(/^([ᵢ₌₀₁₂₃₄₅₆₇₈₉]+)/);
    if (subMatch) {
      subStr = subMatch[1].replace(/ᵢ/g, 'i').replace(/₌/g, '=').replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (d: string) => '0123456789'['₀₁₂₃₄₅₆₇₈₉'.indexOf(d)]);
      restSub = sub.slice(subMatch[1].length);
    }

    let supStr = '';
    let restSup = sup;
    const supMatch = sup.match(/^([ⁿ⁰¹²³⁴⁵⁶⁷⁸⁹]+)/);
    if (supMatch) {
      supStr = supMatch[1].replace(/ⁿ/g, 'n').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d: string) => '0123456789'['⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(d)]);
      restSup = sup.slice(supMatch[1].length);
    }

    if (subStr || supStr) {
      let out = '\\sum';
      if (subStr) out += `_{${subStr}}`;
      if (supStr) out += `^{${supStr}}`;
      return out + ' ' + restSub + restSup;
    }

    return '\\sum ';
  });

  // Standard symbols
  res = res
    .replace(/±/g, ' \\pm ')
    .replace(/×/g, ' \\times ')
    .replace(/÷/g, ' \\div ')
    .replace(/≤/g, ' \\le ')
    .replace(/≥/g, ' \\ge ')
    .replace(/≠/g, ' \\ne ')
    .replace(/∞/g, ' \\infty ')
    .replace(/α/g, ' \\alpha ')
    .replace(/β/g, ' \\beta ')
    .replace(/γ/g, ' \\gamma ')
    .replace(/δ/g, ' \\delta ')
    .replace(/θ/g, ' \\theta ')
    .replace(/λ/g, ' \\lambda ')
    .replace(/μ/g, ' \\mu ')
    .replace(/π/g, ' \\pi ')
    .replace(/σ/g, ' \\sigma ')
    .replace(/ω/g, ' \\omega ')
    .replace(/Δ/g, ' \\Delta ')
    .replace(/Ω/g, ' \\Omega ')
    .replace(/→/g, ' \\rightarrow ');

  return res;
}

/**
 * Converts square root expressions into LaTeX \sqrt{...} recursively.
 */
export function convertSquareRoots(text: string): string {
  if (!text) return '';
  let res = text;

  // Handle √(expr) or \sqrt(expr) or \sqrt{expr}
  let prev = '';
  while (res !== prev) {
    prev = res;
    // 1. √( ... ) with balanced parens
    res = res.replace(/(?:√|\\sqrt)\s*\(([^()]+|\((?:[^()]+|\([^()]*\))*\))*\)/g, (match) => {
      const firstParen = match.indexOf('(');
      const inner = match.substring(firstParen + 1, match.lastIndexOf(')'));
      const innerFraction = convertFractionsToLaTeX(inner);
      return `\\sqrt{${innerFraction}}`;
    });

    // 2. √{ ... } or \sqrt{ ... }
    res = res.replace(/(?:√|\\sqrt)\s*\{([^{}]+)\}/g, (_, inner) => {
      const innerFraction = convertFractionsToLaTeX(inner);
      return `\\sqrt{${innerFraction}}`;
    });

    // 3. √word or √number (e.g. √2x, √b²)
    res = res.replace(/(?:√)\s*([a-zA-Z0-9⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻^_-]+)/g, (_, inner) => `\\sqrt{${inner}}`);
  }

  return res;
}

/**
 * Formats chemical formulas & ions like SO4^2-, Ca2+, H2O, NH4+, SO₄²⁻, Ca²⁺ into LaTeX.
 */
export function convertChemicalFormulasToLaTeX(text: string): string {
  if (!text) return '';
  let res = text;

  // 1. Chemical formulas with superscript charges: SO₄²⁻, Ca²⁺, S²⁻, Fe³⁺
  res = res.replace(/([A-Z][a-zA-Z]?)([₀₁₂₃₄₅₆₇₈₉0-9]*)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)([⁺⁻+-])/g, (match, elem, sub, sup, sign) => {
    if (match.startsWith('\\')) return match;
    const subClean = sub ? sub.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (d: string) => '0123456789'['₀₁₂₃₄₅₆₇₈₉'.indexOf(d)]) : '';
    const supClean = sup ? sup.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d: string) => '0123456789'['⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(d)]) : '';
    const signClean = (sign === '+' || sign === '⁺') ? '+' : '-';

    let out = `\\text{${elem}}`;
    if (subClean) out += `_{${subClean}}`;
    out += `^{${supClean}${signClean}}`;
    return out;
  });

  // 1b. Single chemical ions: Ca²⁺, Na⁺, Cl⁻
  res = res.replace(/([A-Z][a-zA-Z]?)([⁰¹²³⁴⁵⁶⁷⁸⁹]*)([⁺⁻])/g, (match, elem, sup, sign) => {
    if (match.startsWith('\\')) return match;
    const supClean = sup ? sup.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d: string) => '0123456789'['⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(d)]) : '';
    const signClean = (sign === '+' || sign === '⁺') ? '+' : '-';
    return `\\text{${elem}}^{${supClean}${signClean}}`;
  });

  // 2. Chemical caret notation: SO4^2-, Ca^2+, NH4+, H2O
  res = res.replace(/\b([A-Z][a-z]?)(\d*)\s*\^\s*(\d*)([\+\-])/g, (match, elem, sub, sup, sign) => {
    let out = `\\text{${elem}}`;
    if (sub) out += `_{${sub}}`;
    out += `^{${sup}${sign}}`;
    return out;
  });

  // 3. Simple polyatomic/monoatomic ions without carets: SO42-, Ca2+, NH4+, H2O
  res = res.replace(/\b(SO4|CO3|PO4|NO3|NH4|HCO3|MnO4|Cr2O7|Ca|Mg|Fe|Cu|Al|Na|K|Cl|S)(\d*)([\+\-])\b/g, (match, elem, num, sign) => {
    const monoatomic = ['Ca', 'Mg', 'Fe', 'Cu', 'Al', 'Na', 'K', 'Cl', 'S'];
    if (monoatomic.includes(elem)) {
      return `\\text{${elem}}^{${num}${sign}}`;
    }
    const polyElem = elem.replace(/(\d+)/g, '_{$1}');
    return `\\text{${polyElem}}^{${num}${sign}}`;
  });

  return res;
}

/**
 * Converts fractions into LaTeX \frac{num}{den}.
 */
export function convertFractionsToLaTeX(text: string): string {
  if (!text) return '';
  let res = text;

  // Process existing \frac{a}{b} with support for nested braces
  const nestedBracePattern = '([^{}]*(?:\\{[^{}]*\\}[^{}]*)*)';
  const fracRegex = new RegExp(`\\\\frac\\s*\\{${nestedBracePattern}\\}\\s*\\{${nestedBracePattern}\\}`, 'g');
  res = res.replace(fracRegex, (match, num, den) => {
    return `\\frac{${num.trim()}}{${den.trim()}}`;
  });

  const operandPattern = '(?:\\\\sqrt\\{[^{}]+\\}|\\\\frac\\{[^{}]+\\}\\{[^{}]+\\}|\\((?:[^()]|\\([^()]*\\))*\\)|[a-zA-Z0-9⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻°±α-ωΑ-Ω×÷\\^\\_\\pm\\times\\div\\le\\ge\\ne\\infty]+(?:[+\\-–—\\u2212\\*×\\^][a-zA-Z0-9⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻°±α-ωΑ-Ω×÷\\^\\_\\pm\\times\\div\\le\\ge\\ne\\infty]+)*)';
  const fractionRegex = new RegExp(`(${operandPattern})\\s*\\/\\s*(${operandPattern})`, 'g');

  let prev = '';
  while (res !== prev) {
    prev = res;
    res = res.replace(fractionRegex, (match, rawNum, rawDen, offset, fullStr) => {
      if (isEnglishOrSlash(rawNum, rawDen, fullStr, offset, match)) {
        return match;
      }
      let numStr = stripOuterParens(rawNum);
      let denStr = stripOuterParens(rawDen);

      return `\\frac{${numStr}}{${denStr}}`;
    });
  }

  return res;
}

/**
 * Converts powers/exponents (x^2, 10^-3, x²) and subscripts (x_1, H₂O) into standard LaTeX.
 */
export function convertExponentsAndSubscripts(text: string): string {
  if (!text) return '';
  let res = text;

  // 1. Scientific units & exponents: REQUIRES explicit caret ^ OR explicit negative/positive sign OR Unicode superscripts.
  // NEVER convert plain numbers like 100 or 1000 into 10^0!
  res = res.replace(/\b(10)\s*\^\s*([⁺⁻-]?\s*[0-9⁰¹²³⁴⁵⁶⁷⁸⁹]+)\s*([a-zA-ZµÅ°]+)/g, (match, base, exp, unit) => {
    const cleanExp = exp.replace(/⁻/g, '-').replace(/⁺/g, '+').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d: string) => {
      const idx = '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(d);
      return idx !== -1 ? String(idx) : d;
    });
    return `${base}^{${cleanExp}}\\text{ ${unit}}`;
  });
  res = res.replace(/\b(10)\s*\^\s*([⁺⁻-]?\s*[0-9⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (match, base, exp) => {
    const cleanExp = exp.replace(/⁻/g, '-').replace(/⁺/g, '+').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d: string) => {
      const idx = '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(d);
      return idx !== -1 ? String(idx) : d;
    });
    return `${base}^{${cleanExp}}`;
  });

  // 1b. Unicode superscripts directly on 10 (e.g. 10⁻³, 10⁵)
  res = res.replace(/\b(10)([⁻⁺][⁰¹²³⁴⁵⁶⁷⁸⁹]+)\s*([a-zA-ZµÅ°]+)?/g, (match, base, sups, unit) => {
    let cleanExp = '';
    for (const ch of sups) {
      if (ch === '⁻') cleanExp += '-';
      else if (ch === '⁺') cleanExp += '+';
      else {
        const idx = '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(ch);
        if (idx !== -1) cleanExp += idx;
        else cleanExp += ch;
      }
    }
    return unit ? `${base}^{${cleanExp}}\\text{ ${unit}}` : `${base}^{${cleanExp}}`;
  });

  // 1c. Direct negative power on 10 (e.g. 10-3 m, 10-5)
  res = res.replace(/\b(10)\s*-\s*([0-9]+)\s*([a-zA-ZµÅ°]+)?/g, (match, base, exp, unit) => {
    return unit ? `${base}^{-${exp}}\\text{ ${unit}}` : `${base}^{-${exp}}`;
  });

  // 2. Unicode superscripts: x², x³, 10⁻³ (skip if already in \text{...})
  res = res.replace(/([a-zA-Z0-9\)\}])([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (match, base, sups) => {
    let clean = '';
    for (const ch of sups) {
      const idxSup = '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(ch);
      if (idxSup !== -1) clean += idxSup;
      else clean += ch;
    }
    return `${base}^{${clean}}`;
  });

  // 3. Unicode subscripts: H₂O -> H_{2}O, x₁ -> x_{1}
  res = res.replace(/([a-zA-Z0-9\)\}])([₀₁₂₃₄₅₆₇₈₉]+)/g, (match, base, subs) => {
    let clean = '';
    for (const ch of subs) {
      const idxSub = '₀₁₂₃₄₅₆₇₈₉'.indexOf(ch);
      if (idxSub !== -1) clean += idxSub;
      else clean += ch;
    }
    return `${base}_{${clean}}`;
  });

  // 4. Caret exponents: x^2 -> x^{2}, x^(a+b) -> x^{a+b}
  res = res.replace(/([a-zA-Z0-9\)\}\]])\s*\^\s*\(([^()]+)\)/g, '$1^{$2}');
  res = res.replace(/([a-zA-Z0-9\)\}\]])\s*\^\s*(-?[a-zA-Z0-9]+)/g, '$1^{$2}');

  // 5. Underscore subscripts: H_2SO_4 -> H_{2}SO_{4}, P_2Q_3 -> P_{2}Q_{3}, x_1 -> x_{1}
  res = res.replace(/([a-zA-Z0-9\)\}\]])\s*_\s*\(([^()]+)\)/g, '$1_{$2}');
  res = res.replace(/([a-zA-Z0-9\)\}\]])\s*_\s*([0-9]+|[a-zA-Z])/g, '$1_{$2}');

  return res;
}

/**
 * Main Central Converter: Takes any plain text / ASCII math / Unicode expression and turns it into clean LaTeX for KaTeX.
 */
export function textToLaTeX(text: string): string {
  if (!text) return '';

  let res = normalizeLatexShortcuts(text.trim());

  // 0. Replace multiplication asterisks * with \cdot
  res = res.replace(/([a-zA-Z0-9\)\}\]])\s*\*\s*([a-zA-Z0-9\(\{\\])/g, '$1 \\cdot $2');

  // 1. Convert chemical formulas FIRST
  res = convertChemicalFormulasToLaTeX(res);

  // 2. Normalize Unicode symbols (∫, ∑, ±, √, Greek letters, superscripts, subscripts)
  res = normalizeUnicodeSymbols(res);

  // 3. Convert square roots
  res = convertSquareRoots(res);

  // 4. Convert fractions FIRST before isolated exponents
  res = convertFractionsToLaTeX(res);

  // 5. Convert exponents and subscripts
  res = convertExponentsAndSubscripts(res);

  // Clean up double spaces or double braces & format unit words inside fractions
  res = res.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, num, den) => {
    let cleanNum = stripOuterParens(num);
    let cleanDen = stripOuterParens(den);

    const formatPart = (part: string) => {
      const trimmed = part.trim();
      if (/^(?:rad|sec|deg|cm|mm|m|kg|g|mg|mol|Hz|Pa|J|V|A|W|N|Ω|°C)(?:\/[a-z]+)?$/i.test(trimmed)) {
        return `\\text{${trimmed}}`;
      }
      return trimmed;
    };

    return `\\frac{${formatPart(cleanNum)}}{${formatPart(cleanDen)}}`;
  });

  return res;
}

/**
 * Auto-wraps embedded scientific math terms, equations, fractions, and electron configurations in mixed paragraph text with $...$ for inline KaTeX rendering.
 */
export function autoFormatMixedTextToLaTeX(text: string): string {
  if (!text) return '';
  let res = normalizeLatexShortcuts(text);
  if (/\$|\\\(/.test(res)) return res;

  // Auto-wrap chemical terms, electron configurations, fractions, vectors, square roots, superscripts/subscripts, LaTeX commands, and equations into $...$
  const lines = res.split('\n');
  const processedLines = lines.map(line => {
    if (!line.trim()) return line;

    // Check if line contains LaTeX commands or math equations
    const hasLatexCmds = /\\(?:frac|sqrt|omega|pi|Delta|alpha|beta|theta|lambda|mu|sigma|Omega|int|sum|pm|times|div|le|ge|ne|infty|rightarrow)\b/.test(line);
    const hasMathSymbols = /[=^√∫∑±≤≥≠∞αβθπΔ]/;

    if (!hasLatexCmds && !hasMathSymbols) {
      return line.replace(/(\b[A-Za-z0-9_]+\s*\([^)]*[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻^_-]+[^)]*\)|\b[a-zA-Z0-9]+[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻]+\S*|\\(?:vec|bar|hat|overline)\{[^}]+\}|\\sqrt\{[^}]+\}|\((?:[^()]+|\([^()]*\))*\)\/\((?:[^()]+|\([^()]*\))*\))/g, (match) => {
        return `$${match.trim()}$`;
      });
    }

    // Auto-wrap math formulas & equations in mixed sentences
    return line.replace(/(?:(?:\\?[a-zA-Z0-9_]+)\s*=\s*(?:\\?[a-zA-Z0-9_+\-*\/^()\\.{}\[\]\s]+?)(?=\s*[.,;!:]?(\s*\\?[a-zA-Z0-9_]+\s*(=|\\le|\\ge|\\ne|\\approx)|\s+[a-zA-Z]{2,}|\s*$))|\b[a-zA-Z0-9_]+(?:\/[a-zA-Z0-9_\sqrt{}\\]+|\^[0-9_{}\-]+)+|\b\d+(?:\.\d+)?\s*(?:[xX*×]|\\times)\s*10\^?\{?[-\d]+\}?|\b\\frac\{[^{}]+\}\{[^{}]+\}|\b\\sqrt\{[^{}]+\})/g, (match) => {
      const trimmed = match.trim();
      if (trimmed.startsWith('$') && trimmed.endsWith('$')) return trimmed;
      return `$${trimmed}$`;
    });
  });

  return processedLines.join('\n');
}

/**
 * Checks if a string contains mathematical equations or expressions that require KaTeX rendering.
 */
export function isMathExpression(text: string): boolean {
  if (!text) return false;

  if (/\\(frac|sqrt|int|sum|pm|times|div|le|ge|ne|alpha|beta|gamma|delta|theta|lambda|mu|pi|sigma|omega|Delta|Omega|text|vec|bar|hat|ddot|dot|overline|mathbf|mathcal|mathrm)/.test(text)) {
    return true;
  }
  if (/\$|\\\[|\\\(|\^|_|√|∫|∑|±|≤|≥|≠|∞|α|β|θ|π|Δ|[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻]/.test(text)) {
    return true;
  }
  return false;
}

// ============================================================
// Smart Math Input System from question-bank-portal.vercel.app
// Auto-detects math-like plain-text patterns (fractions, exponents,
// subscripts, chemical formulas, charges, roots, Greek letters,
// operators, trig/calculus notation) and converts them to LaTeX,
// wrapping only the math portion in $...$.
// Genuine plain English words are left completely untouched.
// ============================================================

const GREEK_WORDS_MAP: Record<string, string> = {
  alpha:'\\alpha', beta:'\\beta', gamma:'\\gamma', theta:'\\theta',
  lambda:'\\lambda', omega:'\\omega', pi:'\\pi', mu:'\\mu',
  sigma:'\\sigma', phi:'\\phi', delta:'\\delta', epsilon:'\\epsilon'
};

const TRIG_WORDS_MAP: Record<string, string> = {
  sin:'\\sin', cos:'\\cos', tan:'\\tan', cot:'\\cot',
  sec:'\\sec', cosec:'\\csc', csc:'\\csc', log:'\\log', ln:'\\ln'
};

const GREEK_LIST_KEYS = Object.keys(GREEK_WORDS_MAP).sort((a,b)=>b.length-a.length);

const UNICODE_SUPERSCRIPTS_MAP: Record<string, string> = {'\u2070':'0','\u00b9':'1','\u00b2':'2','\u00b3':'3','\u2074':'4','\u2075':'5','\u2076':'6','\u2077':'7','\u2078':'8','\u2079':'9','\u207a':'+','\u207b':'-'};
const UNICODE_SUBSCRIPTS_MAP: Record<string, string> = {'\u2080':'0','\u2081':'1','\u2082':'2','\u2083':'3','\u2084':'4','\u2085':'5','\u2086':'6','\u2087':'7','\u2088':'8','\u2089':'9','\u208a':'+','\u208b':'-'};

function greekify(str: string): string {
  let result = str;
  GREEK_LIST_KEYS.forEach(word => {
    const re = new RegExp('(^|[^A-Za-z\\\\])(' + word + ')(\\d*)', 'gi');
    result = result.replace(re, (m, pre, w, digits, offset, full) => {
      if (!digits) {
        const nextChar = full[offset + m.length];
        if (nextChar && /[A-Za-z]/.test(nextChar)) return m;
      }
      return pre + GREEK_WORDS_MAP[w.toLowerCase()] + (digits ? '_{' + digits + '}' : '');
    });
  });
  return result;
}

function splitFinalSegments(raw: string): { type: string; value: string }[] {
  const segments: { type: string; value: string }[] = [];
  let i = 0; const n = raw.length; let buf = '';
  while (i < n) {
    if (raw.startsWith('{{IMG::', i)) {
      const close = raw.indexOf('}}', i + 7);
      if (close === -1) { buf += raw.slice(i); break; }
      if (buf) { segments.push({type:'final', value:buf}); buf=''; }
      segments.push({type:'final', value: raw.slice(i, close+2)});
      i = close + 2; continue;
    }
    if (raw[i] === '$') {
      const isDisplay = raw[i+1] === '$';
      const delim = isDisplay ? '$$' : '$';
      const end = raw.indexOf(delim, i + delim.length);
      if (end === -1) { buf += raw.slice(i); break; }
      if (buf) { segments.push({type:'final', value:buf}); buf=''; }
      segments.push({type:'final', value: raw.slice(i, end+delim.length)});
      i = end + delim.length; continue;
    }
    buf += raw[i]; i++;
  }
  if (buf) segments.push({type:'final', value:buf});
  return segments;
}

function wrapMath(latex: string): string { return '$' + latex + '$'; }

function convertFraction(str: string): string {
  const m = str.match(/^(\(.+\)|[^\/()]+)\/(\(.+\)|[^\/()]+)$/);
  if (!m) return str;
  let num = m[1], den = m[2];
  if (num.startsWith('(') && num.endsWith(')')) num = num.slice(1,-1);
  if (den.startsWith('(') && den.endsWith(')')) den = den.slice(1,-1);
  const numConv = convertIdentifierSubscripts(greekify(convertFraction(num)));
  const denConv = convertIdentifierSubscripts(greekify(convertFraction(den)));
  return '\\frac{' + numConv + '}{' + denConv + '}';
}

function convertChemSubscripts(str: string): string {
  if (!/^([A-Z][a-z]?\d*)+$/.test(str)) return str;
  if (!/\d/.test(str)) return str;
  return str.replace(/([A-Z][a-z]?)(\d+)/g, (m, el, num) => el + '_{' + num + '}');
}

function convertIdentifierSubscripts(str: string): string {
  return str.replace(/([A-Za-z])(\d+)/g, (m, letter, digits) => letter + '_{' + digits + '}');
}

function hasUnclosedLatexEnvironment(raw: string): boolean {
  const begins = (raw.match(/\\begin\{/g) || []).length;
  const ends = (raw.match(/\\end\{/g) || []).length;
  return begins > ends;
}

const TWO_ARG_LATEX_COMMANDS = ['frac','dfrac','tfrac','binom','dbinom','tbinom'];

function looksIncompleteLatex(raw: string): boolean {
  if (!/\\[a-zA-Z]/.test(raw)) return false;
  let depth = 0;
  for (const ch of raw) {
    if (ch === '{') depth++;
    else if (ch === '}') depth = Math.max(0, depth-1);
  }
  if (depth > 0) return true;

  const trimmed = raw.replace(/\s+$/,'');
  if (/\\[a-zA-Z]+$/.test(trimmed)) return true;
  if (endsWithOneArgOfTwoArgCommand(trimmed)) return true;
  return hasUnclosedLatexEnvironment(raw);
}

function endsWithOneArgOfTwoArgCommand(trimmed: string): boolean {
  const n = trimmed.length;
  let i = 0, lastDeficient = false;
  while (i < n) {
    const m = trimmed.slice(i).match(/^\\([a-zA-Z]+)/);
    if (m && TWO_ARG_LATEX_COMMANDS.includes(m[1])) {
      let end = i + m[0].length, got = 0;
      for (let a = 0; a < 2; a++) {
        let j = end;
        while (j < n && /\s/.test(trimmed[j])) j++;
        if (trimmed[j] !== '{') break;
        let depth = 1, k = j + 1;
        while (k < n && depth > 0) {
          if (trimmed[k] === '{') depth++;
          else if (trimmed[k] === '}') depth--;
          k++;
        }
        if (depth !== 0) { end = n; got++; break; }
        end = k; got++;
      }
      lastDeficient = (got < 2 && end === n);
      i = end;
      continue;
    }
    i++;
  }
  return lastDeficient;
}

function groupBalancedTokens(text: string): { type: string; value: string }[] {
  const tokens: { type: string; value: string }[] = [];
  let i = 0; const n = text.length;
  while (i < n) {
    if (/\s/.test(text[i])) {
      const start = i;
      while (i < n && /\s/.test(text[i])) i++;
      tokens.push({type:'space', value:text.slice(start,i)});
      continue;
    }
    const start = i;
    let depth = 0;
    while (i < n) {
      const ch = text[i];
      if (ch === '(' || ch === '[' || ch === '{') depth++;
      else if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth-1);
      if (/\s/.test(ch) && depth === 0) {
        if (looksIncompleteLatex(text.slice(start, i))) { i++; continue; }
        break;
      }
      i++;
    }
    tokens.push({type:'word', value:text.slice(start,i)});
  }
  return tokens;
}

function convertGeneralExpression(str: string): { latex: string; changed: boolean } {
  let changed = false;
  let result = '';
  let i = 0; const n = str.length;
  while (i < n) {
    const ch = str[i];
    if (ch === '(' || ch === '[') {
      const closeCh = ch === '(' ? ')' : ']';
      let depth = 1, j = i+1;
      while (j < n && depth > 0) {
        if (str[j] === ch) depth++;
        else if (str[j] === closeCh) depth--;
        j++;
      }
      const hasClose = depth === 0;
      const inner = hasClose ? str.slice(i+1, j-1) : str.slice(i+1);
      const innerConv = convertGeneralExpression(inner);
      if (innerConv.changed) changed = true;

      let groupLatex: string;
      if (ch === '(' && hasClose && /√\s*$/.test(result)) {
        result = result.replace(/√\s*$/, '');
        groupLatex = '\\sqrt{' + innerConv.latex + '}';
        changed = true;
      } else {
        const leftDelim = ch === '(' ? '\\left(' : '\\left[';
        const rightDelim = ch === '(' ? '\\right)' : '\\right]';
        groupLatex = hasClose ? (leftDelim + innerConv.latex + rightDelim) : (ch + innerConv.latex);
      }
      i = hasClose ? j : n;

      if (hasClose && i < n && str[i] === '^') {
        let k = i + 1, expLatex = '';
        if (str[k] === '(') {
          let ed = 1, m2 = k+1;
          while (m2 < n && ed > 0) {
            if (str[m2] === '(') ed++; else if (str[m2] === ')') ed--;
            m2++;
          }
          expLatex = convertGeneralExpression(str.slice(k+1, m2-1)).latex;
          k = m2;
        } else if (str[k] === '{') {
          const close = str.indexOf('}', k);
          if (close !== -1) { expLatex = str.slice(k+1, close); k = close+1; }
        } else {
          const dm = str.slice(k).match(/^-?\d+/);
          if (dm) { expLatex = dm[0]; k += dm[0].length; }
        }
        if (expLatex) { groupLatex += '^{' + expLatex + '}'; changed = true; i = k; }
      }

      result += groupLatex;
      continue;
    }
    let j = i;
    while (j < n && str[j] !== '(' && str[j] !== '[') j++;
    const chunk = str.slice(i, j);
    const chunkConv = convertSimpleChunk(chunk);
    if (chunkConv.changed) changed = true;
    result += chunkConv.latex;
    i = j;
  }
  return {latex: result, changed};
}

function splitTopLevelTerms(str: string): string[] {
  const parts: string[] = [];
  let depth = 0, start = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth = Math.max(0, depth-1);
    else if ((ch === '+' || ch === '-') && depth === 0) {
      if (i === 0) continue;
      const prevNonSpace = str.slice(0, i).replace(/\s+$/,'').slice(-1);
      if (prevNonSpace === '^') continue;
      let opStart = i;
      while (opStart > start && /\s/.test(str[opStart-1])) opStart--;
      let opEnd = i + 1;
      while (opEnd < str.length && /\s/.test(str[opEnd])) opEnd++;
      parts.push(str.slice(start, opStart));
      parts.push(str.slice(opStart, opEnd));
      start = opEnd;
      i = opEnd - 1;
    }
  }
  parts.push(str.slice(start));
  return parts;
}

function splitTopLevelEquals(str: string): string[] {
  const parts: string[] = [];
  let depth = 0, start = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth = Math.max(0, depth-1);
    else if (ch === '=' && depth === 0) {
      const prev = str[i-1];
      if (prev === '<' || prev === '>' || prev === '!') continue;
      parts.push(str.slice(start, i));
      parts.push('=');
      start = i + 1;
    }
  }
  parts.push(str.slice(start));
  return parts;
}

function convertSimpleChunk(chunk: string): { latex: string; changed: boolean } {
  let changed = false;
  let work = greekify(chunk);
  if (work !== chunk) changed = true;

  if (work.includes('√')) {
    const withRadical = work.replace(/√\s*([0-9]+(?:\.[0-9]+)?|[a-zA-Z][a-zA-Z0-9_{}]*)/g, '\\sqrt{$1}');
    if (withRadical !== work) { work = withRadical; changed = true; }
  }

  const eqParts = splitTopLevelEquals(work);
  if (eqParts.length > 1) {
    work = eqParts.map(part => {
      if (part === '=') return part;
      const r = convertOneEqualitySide(part);
      if (r.changed) changed = true;
      return r.latex;
    }).join('');
  } else {
    const r = convertOneEqualitySide(work);
    if (r.changed) changed = true;
    work = r.latex;
  }

  return {latex: work, changed};
}

function convertOneEqualitySide(work: string): { latex: string; changed: boolean } {
  let changed = false;

  const termSplit = splitTopLevelTerms(work);
  if (termSplit.length > 1) {
    work = termSplit.map(part => {
      if (/^\s*[+\-]\s*$/.test(part)) return part;
      const f = convertFraction(part);
      if (f !== part) changed = true;
      const s = convertIdentifierSubscripts(f);
      if (s !== f) changed = true;
      return s;
    }).join('');
  } else {
    const f = convertFraction(work);
    if (f !== work) { work = f; changed = true; }
    const withSub = convertIdentifierSubscripts(work);
    if (withSub !== work) { work = withSub; changed = true; }
  }

  if (/[A-Za-z0-9]_\{?[A-Za-z0-9+\-]+\}?/.test(work)) changed = true;
  if (/[A-Za-z0-9)\]]\^\{?[A-Za-z0-9+\-]+\}?/.test(work)) changed = true;

  const supFixed = work.replace(/([A-Za-z0-9)\]])\^(\{[^{}]*\}|-?[A-Za-z0-9]+)/g, (m, base, exp) => {
    if (exp.startsWith('{')) return m;
    return base + '^{' + exp + '}';
  });
  if (supFixed !== work) { work = supFixed; changed = true; }

  [[/<=/g,'\\le{}'],[/>=/g,'\\ge{}'],[/!=/g,'\\ne{}']].forEach(([re,rep]) => {
    if ((re as RegExp).test(work)) { work = work.replace(re as RegExp, rep as string); changed = true; }
  });

  return {latex: work, changed};
}

const UNIT_FRACTIONS_SET = new Set([
  'km/h','km/hr','m/s','kg/s','cm/s','ft/s','mi/h','mph','rad/s','g/l','mg/ml','g/ml'
]);

function isNonMathToken(str: string): boolean {
  if (/^https?:\/\//i.test(str)) return true;
  if (/^www\./i.test(str)) return true;
  if (/^[A-Za-z]:\\/.test(str)) return true;
  if (/^\.{1,2}\//.test(str)) return true;
  if (/^\d{1,4}\/\d{1,2}(\/\d{1,4})?$/.test(str)) return true;
  if (/^\[.*\]\(.*\)$/.test(str)) return true;
  if (/^`.*`$/.test(str)) return true;
  if (UNIT_FRACTIONS_SET.has(str.toLowerCase())) return true;
  return false;
}

function convertToken(tokRaw: string): { converted: boolean; latex?: string; trailing?: string } {
  const m0 = tokRaw.match(/^([\s\S]*?)([.,;:!?]*)$/);
  if (!m0) return {converted:false};
  const core = m0[1], trailing = m0[2];
  if (!core) return {converted:false};

  if (/\\[a-zA-Z]/.test(core)) return {converted:true, latex:core, trailing};

  const lower = core.toLowerCase();
  if (lower === 'infinity') return {converted:true, latex:'\\infty', trailing};
  if (core === '+-') return {converted:true, latex:'\\pm{}', trailing};

  if (isNonMathToken(core)) return {converted:false};

  if (core.includes('(') || core.includes(')') || core.includes('[') || core.includes(']')) {
    const f = convertFraction(core);
    if (f !== core) return {converted:true, latex:f, trailing};
    const g = convertGeneralExpression(core);
    if (g.changed) return {converted:true, latex:g.latex, trailing};
  }

  let work = core, changed = false;

  let m: RegExpMatchArray | null;
  if (!changed && (m = work.match(/^sqrt\((.+)\)$/i))) {
    work = '\\sqrt{' + convertFraction(m[1]) + '}'; changed = true;
  } else if (!changed && (m = work.match(/^root\((\d+),(.+)\)$/i))) {
    work = '\\sqrt[' + m[1] + ']{' + convertFraction(m[2]) + '}'; changed = true;
  }

  if (!changed && (m = work.match(/^([A-Za-z0-9]+?)(\^?)(\d*)([+-])$/))) {
    const base = convertChemSubscripts(m[1]);
    const supPart = (m[3] ? m[3] : '') + m[4];
    work = base + '^{' + supPart + '}'; changed = true;
  }

  if (!changed) {
    for (const key in TRIG_WORDS_MAP) {
      const re = new RegExp('^' + key + '(\\^\\{?\\d+\\}?)?$', 'i');
      if (re.test(work)) {
        work = work.replace(new RegExp('^'+key,'i'), TRIG_WORDS_MAP[key]);
        work = work.replace(/\^\{?(\d+)\}?$/, '^{$1}');
        changed = true; break;
      }
    }
  }

  if (!changed) {
    const sc = convertSimpleChunk(work);
    if (sc.changed) { work = sc.latex; changed = true; }
  }

  if (!changed && work.includes('^')) {
    const s = work.replace(/\^\{?(-?\d+)\}?/g, '^{$1}');
    if (s !== work) { work = s; changed = true; }
  }

  if (changed) return {converted:true, latex:work, trailing};
  return {converted:false};
}

function smartConvertZone(text: string): string {
  text = text
    .replace(/\\item\s*\[([^\]]*)\]\s*/g, '$1 ')
    .replace(/\\item\b\s*/g, '• ')
    .replace(/\\(?:begin|end)\{(?:itemize|enumerate)\*?\}\s*/g, '')
    .replace(/\\(?:textbf|textit|emph|text)\{([^{}]*)\}/g, '$1')
    .replace(/\\section\*?\{([^{}]*)\}/g, '$1\n');

  text = text.replace(/\u2212/g, '-');

  text = text.replace(/([\u2070\u00b9\u00b2\u00b3\u2074-\u2079\u207a\u207b]+)/g, m =>
    '^{' + m.split('').map(c => UNICODE_SUPERSCRIPTS_MAP[c] || c).join('') + '}');
  text = text.replace(/([\u2080-\u2089\u208a\u208b]+)/g, m =>
    '_{' + m.split('').map(c => UNICODE_SUBSCRIPTS_MAP[c] || c).join('') + '}');

  text = text.replace(/\\begin\{([a-zA-Z*]+)\}[\s\S]*?\\end\{\1\}/g, m => wrapMath(m));

  text = text.replace(/\bint\s+(\S.*?)\s+dx\b/g, (m, expr) => wrapMath('\\int ' + expr.trim() + '\\,dx'));
  text = text.replace(/\bsum\s+i\s*=\s*(\S+)\s+to\s+(\S+)/gi, (m, a, b) => wrapMath('\\sum_{i=' + a + '}^{' + b + '}'));
  text = text.replace(/\blim\s+([a-zA-Z])\s*->\s*(\S+)/gi, (m, v, to) => wrapMath('\\lim_{' + v + '\\to ' + to + '}'));

  const parts = text.split(/(\$[^$]*\$)/g);
  return parts.map(part => {
    if (part.startsWith('$') && part.endsWith('$') && part.length > 1) return part;
    return groupBalancedTokens(part).map(t => {
      if (t.type === 'space') return t.value;
      const r = convertToken(t.value);
      return r.converted ? wrapMath(r.latex!) + (r.trailing || '') : t.value;
    }).join('');
  }).join('');
}

function mergeMathBlocks(text: string): string {
  let res = text;
  // 1. Merge "var = $Math$" -> "$var = Math$"
  res = res.replace(/\b([a-zA-Z0-9_]+)\s*(=|\\le|\\ge|\\ne|\\approx)\s*\$([^$]+)\$/g, (_m, v, op, math) => `$${v} ${op} ${math}$`);
  // 2. Merge "$Math1$ = $Math2$" -> "$Math1 = Math2$"
  res = res.replace(/\$([^$]+)\$\s*(=|\\le|\\ge|\\ne|\\approx)\s*\$([^$]+)\$/g, (_m, m1, op, m2) => `$${m1} ${op} ${m2}$`);
  // 3. Merge "$Math1 =$ $Math2$" -> "$Math1 = Math2$"
  res = res.replace(/\$([^$]+\s*=)\$\s*\$([^$]+)\$/g, (_m, m1, m2) => `$${m1} ${m2}$`);
  // 4. Merge "$Math1$ = val + $Math2$" -> "$Math1 = val + Math2$"
  res = res.replace(/\$([^$]+)\$\s*=\s*(\d+(?:\.\d+)?)\s*([+\-*/])\s*\$([^$]+)\$/g, (_m, m1, val, op, m2) => `$${m1} = ${val} ${op} ${m2}$`);
  return res;
}

export function smartConvertRaw(raw: string): string {
  if (!raw) return '';
  const converted = splitFinalSegments(raw).map(seg => {
    if (seg.value.startsWith('$') || seg.value.startsWith('{{IMG::')) return seg.value;
    const formatted = autoFormatMixedTextToLaTeX(seg.value);
    if (/\$|\\\(/.test(formatted)) return formatted;
    return smartConvertZone(seg.value);
  }).join('');
  return mergeMathBlocks(converted);
}
