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
  res = res.replace(/\bE0\b/g, 'E_0');
  res = res.replace(/\bI0\b/g, 'I_0');
  res = res.replace(/\bV0\b/g, 'V_0');
  // Greek words with subscripts (e.g. mu0 -> \mu_0, lambda1 -> \lambda_1, theta2 -> \theta_2)
  res = res.replace(/\b(alpha|beta|gamma|theta|lambda|omega|pi|mu|sigma|phi|delta|epsilon)(\d+)\b/gi, (m, g, num) => `\\${g.toLowerCase()}_{${num}}`);
  // Standalone Greek words typed without backslash (e.g. alpha -> \alpha, theta -> \theta, omega -> \omega)
  res = res.replace(/(?<!\\)\b(alpha|beta|gamma|theta|lambda|omega|pi|mu|sigma|phi|delta|epsilon)\b/gi, (m, g) => `\\${g.toLowerCase()}`);
  // Roots: root(n, expr) -> \sqrt[n]{expr}, sqrt(expr) -> \sqrt{expr}
  res = res.replace(/\broot\((\d+),\s*(.+?)\)/gi, '\\sqrt[$1]{$2}');
  res = res.replace(/\bsqrt\((.+?)\)/gi, '\\sqrt{$1}');
  // Operators: <= -> \le, >= -> \ge, != -> \ne, +- -> \pm
  res = res.replace(/<=/g, '\\le ');
  res = res.replace(/>=/g, '\\ge ');
  res = res.replace(/!=/g, '\\ne ');
  res = res.replace(/\+-/g, '\\pm ');
  // Handle \sqrt followed directly by digit/letter (e.g. \sqrt2 -> \sqrt{2})
  res = res.replace(/\\sqrt\s*([0-9a-zA-Z])(?![a-zA-Z0-9_{}])/g, '\\sqrt{$1}');
  // Vector arrows & unit hats: e.g. \vec E -> \vec{E}, \hat i -> \hat{i}, r ⃗ -> \vec{r}, i ˆ -> \hat{i}, E ⃗ -> \vec{E}
  res = res.replace(/\\vec\s*([a-zA-Z0-9])(?![a-zA-Z0-9_{}])/g, '\\vec{$1}');
  res = res.replace(/\\hat\s*([a-zA-Z0-9])(?![a-zA-Z0-9_{}])/g, '\\hat{$1}');
  res = res.replace(/\\bar\s*([a-zA-Z0-9])(?![a-zA-Z0-9_{}])/g, '\\bar{$1}');
  res = res.replace(/([a-zA-Z0-9])\s*[\u20D7\u20D6\u20D1\u20D0\u20E1\u2192]/g, '\\vec{$1}');
  res = res.replace(/([a-zA-Z0-9])\s*[\u02C6\u0302\u0306\u030a]/g, '\\hat{$1}');
  res = res.replace(/\b([a-zA-Z0-9])\s*[\^ˆ](?=\s*[\+=\-\*\/\),\. ]|$)/g, '\\hat{$1}');
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
    return line.replace(/(?:\\(?:frac|sqrt|omega|pi|Delta|alpha|beta|theta|lambda|mu|sigma|Omega|pm|times|div|le|ge|ne|infty|int|sum|rightarrow|vec|bar|hat|overline)\b(?:\{[^{}]*\}|\([^()]*\)|[a-zA-Z0-9_*^/\\\-–—\s])*(?=\s*[.,;!]?(\s+[a-zA-Z]{3,}|\s*$))|\b[a-zA-Z0-9_]+\s*=\s*(?:\\?[a-zA-Z0-9_+\-*\/^()\\.{}\s]+)|\b[a-zA-Z0-9_]+(?:\/[a-zA-Z0-9_\sqrt{}\\]+|\^[0-9_{}\-]+)+|\b\d+(?:\.\d+)?\s*(?:[xX*×]|\\times)\s*10\^?\{?[-\d]+\}?|\b\\frac\{[^{}]+\}\{[^{}]+\}|\b\\sqrt\{[^{}]+\})/g, (match) => {
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
  if (/\//.test(text) && !isEnglishOrSlash('a', 'b', text, text.indexOf('/'), 'a/b')) {
    return true;
  }

  return false;
}
