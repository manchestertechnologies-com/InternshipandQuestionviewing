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
 * Normalizes common LaTeX physics/math shorthand typos and shortcuts.
 * e.g. \wt -> \omega t, \w -> \omega, \D -> \Delta
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

  // 3. Known English text options & slash pairs (case-insensitive)
  const knownTextSlashPairs = new Set([
    'and/or', 'true/false', 'yes/no', 'input/output', 'pass/fail', 'male/female',
    'either/or', 'on/off', 'in/out', 'up/down', 'left/right', 'high/low',
    'top/bottom', 'front/back', 'increase/decrease', 'positive/negative',
    'acid/base', 'day/night', 'correct/incorrect', 'even/odd', 'real/imaginary',
    'open/closed', 'before/after', 'start/stop', 'win/loss', 'read/write',
    'import/export', 'buy/sell', 'push/pull', 'plus/minus', 'north/south', 'east/west',
    'or', 'and or'
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
    if (fullStr.includes('=')) return false;

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

  // Process existing \frac{a}{b}
  res = res.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, (match, num, den) => {
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

  // 1. Scientific units & exponents: e.g. 10^-3 nm -> 10^{-3}\text{ nm}, 10⁻³ nm -> 10^{-3}\text{ nm}
  res = res.replace(/(10)\s*\^?\s*([⁺⁻-]?\s*[0-9⁰¹²³⁴⁵⁶⁷⁸⁹]+)\s*([a-zA-ZµÅ°]+)/g, (match, base, exp, unit) => {
    const cleanExp = exp.replace(/⁻/g, '-').replace(/⁺/g, '+').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d: string) => {
      const idx = '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(d);
      return idx !== -1 ? String(idx) : d;
    });
    return `${base}^{${cleanExp}}\\text{ ${unit}}`;
  });
  res = res.replace(/(10)\s*\^?\s*([⁺⁻-]?\s*[0-9⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, (match, base, exp) => {
    const cleanExp = exp.replace(/⁻/g, '-').replace(/⁺/g, '+').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d: string) => {
      const idx = '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(d);
      return idx !== -1 ? String(idx) : d;
    });
    return `${base}^{${cleanExp}}`;
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
