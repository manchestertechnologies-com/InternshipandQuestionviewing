/**
 * Utility for preserving Subscripts, Superscripts, Chemical Formulas, 
 * Math Equations, and Symbols when copying & pasting text from PDF, Word, Web, or HTML.
 */

// Subscript mapping for Unicode characters
const SUB_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋', '=': '₌', '(': '₍', ')': '₎',
  'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ', 'i': 'ᵢ', 'j': 'ⱼ',
  'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ', 'o': 'ₒ',
  'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
  'v': 'ᵥ', 'x': 'ₓ'
};

// Superscript mapping for Unicode characters
const SUPER_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  'n': 'ⁿ', 'i': 'ⁱ', 'x': 'ˣ', 'y': 'ʸ', 'a': 'ª',
  'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ', 'f': 'ᶠ',
  'g': 'ᵍ', 'h': 'ʰ', 'j': 'ʲ', 'k': 'ᵏ', 'l': 'ˡ',
  'm': 'ᵐ', 'o': 'ᵒ', 'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ',
  't': 'ᵗ', 'u': 'ᵘ', 'v': 'ᵛ', 'w': 'ʷ', 'z': 'ᶻ'
};

export function convertToSubscript(text: string): string {
  let res = '';
  for (const ch of text) {
    res += SUB_MAP[ch] || SUB_MAP[ch.toLowerCase()] || `_${ch}`;
  }
  return res;
}

export function convertToSuperscript(text: string): string {
  let res = '';
  for (const ch of text) {
    res += SUPER_MAP[ch] || SUPER_MAP[ch.toLowerCase()] || `^${ch}`;
  }
  return res;
}

/**
 * Auto-formats ionic charges (monoatomic & polyatomic) and chemical formulas:
 * e.g. S2- / S^2- / S²^- / S²^– -> S²⁻
 * e.g. Cl- / Cl^- -> Cl⁻
 * e.g. K+ / K^+ -> K⁺
 * e.g. Ca2+ / Ca^2+ / Ca²^+ -> Ca²⁺
 * e.g. Fe3+ -> Fe³⁺, Cu2+ -> Cu²⁺, Al3+ -> Al³⁺
 * e.g. SO4^2- -> SO₄²⁻, CO3^2- -> CO₃²⁻, NO3^- -> NO₃⁻, NH4^+ -> NH₄⁺, PO4^3- -> PO₄³⁻, HCO3^- -> HCO₃⁻, MnO4^- -> MnO₄⁻, Cr2O7^2- -> Cr₂O₇²⁻
 */
export function autoFormatIonicChargesAndChemistry(text: string): string {
  if (!text) return '';
  let result = text;

  const minusSet = '[+\\-–—\\u2212\\u2010-\\u2015\\u207B\\u207A]';

  // 1. Format temperatures like 0-50C, 0-5^0C, 0-5oC -> 0-5°C
  result = result.replace(/(\d+)\s*(?:[0o⁰]C|°C|\^0C)/g, '$1°C');
  result = result.replace(/(\d+)-(\d+)\s*0C/gi, '$1-$2°C');

  // 2. Clean element with existing superscript digit(s) followed by caret and sign: e.g. S²^-, S²^–, Ca²^+ -> S²⁻, Ca²⁺
  const superCaretRegex = new RegExp(`([A-Z][a-z]?[⁰¹²³⁴⁵⁶⁷⁸⁹]+)\\s*\\^\\s*(${minusSet})`, 'g');
  result = result.replace(superCaretRegex, (_, elemSup, sign) => {
    const supSign = (sign === '+' || sign === '⁺') ? '⁺' : '⁻';
    return elemSup + supSign;
  });

  // 3. Format polyatomic ions with digit BEFORE caret AND digit AFTER caret:
  // e.g. SO4^2- -> SO₄²⁻, CO3^2- -> CO₃²⁻, PO4^3- -> PO₄³⁻, Cr2O7^2- -> Cr₂O₇²⁻
  const polyCaretTwoDigitsRegex = new RegExp(`([A-Z][a-z]?|\\)|\\\])(\\d+)\\s*\\^\\s*([0-9⁰¹²³⁴⁵⁶⁷⁸⁹]+)\\s*(${minusSet})`, 'g');
  result = result.replace(polyCaretTwoDigitsRegex, (_, elem, subDigit, supDigits, sign) => {
    const subs = subDigit.split('').map((d: string) => SUB_MAP[d] || d).join('');
    const cleanDigits = supDigits.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d: string) => {
      const idx = '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(d);
      return idx !== -1 ? String(idx) : d;
    });
    const sups = cleanDigits.split('').map((d: string) => SUPER_MAP[d] || d).join('');
    const supSign = (sign === '+' || sign === '⁺') ? '⁺' : '⁻';
    return elem + subs + sups + supSign;
  });

  // 4. Format polyatomic / monoatomic ions with digit BEFORE caret AND ONLY SIGN AFTER caret:
  // e.g. NO3^- -> NO₃⁻, NH4^+ -> NH₄⁺, HCO3^- -> HCO₃⁻, MnO4^- -> MnO₄⁻, S2^- -> S²⁻, Ca2^+ -> Ca²⁺
  const polyCaretOneDigitRegex = new RegExp(`([A-Z][a-z]?|\\)|\\\])(\\d+)\\s*\\^\\s*(${minusSet})`, 'g');
  result = result.replace(polyCaretOneDigitRegex, (match, elem, subDigit, sign) => {
    const monoatomicElements = ['Fe', 'Cu', 'Ca', 'Ba', 'Mg', 'Zn', 'Al', 'Na', 'K', 'Li', 'Ag', 'Pb', 'Hg', 'Sn', 'Cr', 'Ni', 'Co', 'S'];
    const supSign = (sign === '+' || sign === '⁺') ? '⁺' : '⁻';
    if (monoatomicElements.includes(elem)) {
      const sups = subDigit.split('').map((d: string) => SUPER_MAP[d] || d).join('');
      return elem + sups + supSign;
    }
    const subs = subDigit.split('').map((d: string) => SUB_MAP[d] || d).join('');
    return elem + subs + supSign;
  });

  // 5. Format monoatomic caret charges: e.g. S^2- -> S²⁻, Ca^2+ -> Ca²⁺, Cl^- -> Cl⁻, K^+ -> K⁺
  const monoCaretRegex = new RegExp(`([A-Z][a-z]?|\\)|\\\])(\\d*)\\s*\\^\\s*([0-9⁰¹²³⁴⁵⁶⁷⁸⁹]*)\\s*(${minusSet})`, 'g');
  result = result.replace(monoCaretRegex, (_, elem, digitBefore, digitAfter, sign) => {
    const rawDigit = digitBefore || digitAfter;
    let sups = '';
    if (rawDigit) {
      const cleanDigits = rawDigit.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d: string) => {
        const idx = '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(d);
        return idx !== -1 ? String(idx) : d;
      });
      sups = cleanDigits.split('').map((d: string) => SUPER_MAP[d] || d).join('');
    }
    const supSign = (sign === '+' || sign === '⁺') ? '⁺' : '⁻';
    return elem + sups + supSign;
  });

  // 6. Polyatomic ions with numbers & charges WITHOUT carets:
  // e.g. SO42- -> SO₄²⁻, CO32- -> CO₃²⁻, Cr2O72- -> Cr₂O₇²⁻, PO43- -> PO₄³⁻
  result = result.replace(/([A-Z][a-z]?|\)|\])(\d+)(\d)([\+\-\u2212–—])(?![a-zA-Z0-9])/g, (_, elem, subDigits, supDigit, sign) => {
    const subs = subDigits.split('').map((d: string) => SUB_MAP[d] || d).join('');
    const sup = SUPER_MAP[supDigit] || supDigit;
    const supSign = (sign === '+' || sign === '⁺') ? '⁺' : '⁻';
    return elem + subs + sup + supSign;
  });

  // 7. Monoatomic / Polyatomic ions with 1 digit + charge WITHOUT carets:
  // e.g. NO3- -> NO₃⁻, NH4+ -> NH₄⁺, MnO4- -> MnO₄⁻, Fe3+ -> Fe³⁺, Cu2+ -> Cu²⁺, Ca2+ -> Ca²⁺, S2- -> S²⁻, Al3+ -> Al³⁺
  result = result.replace(/([A-Z][a-z]?)(\d)([\+\-\u2212–—])(?![a-zA-Z0-9])/g, (match, elem, numDigit, sign) => {
    const sup = SUPER_MAP[numDigit] || numDigit;
    const sub = SUB_MAP[numDigit] || numDigit;
    const supSign = (sign === '+' || sign === '⁺') ? '⁺' : '⁻';

    if (['Fe', 'Cu', 'Ca', 'Ba', 'Mg', 'Zn', 'Al', 'Na', 'K', 'Li', 'Ag', 'Pb', 'Hg', 'Sn', 'Cr', 'Ni', 'Co', 'S'].includes(elem)) {
      return elem + sup + supSign;
    }
    return elem + sub + supSign;
  });

  // 8. Single ionic charges without digits: Cl- -> Cl⁻, K+ -> K⁺
  result = result.replace(/([A-Z][a-z]?|\)|\]|[₀-₉]|[⁰-⁹])\s*([\+\-\u2212–—])(?![a-zA-Z0-9\+\-\=])/g, (match, elem, sign) => {
    const supSign = (sign === '+' || sign === '⁺') ? '⁺' : '⁻';
    return elem + supSign;
  });

  // 9. Periodic Table Chemical Subscripts for neutral molecules: H2O -> H₂O, CO2 -> CO₂, H2SO4 -> H₂SO₄
  // Exclude numbers immediately followed by ionic charge superscripts ⁻ or ⁺
  const chemicalSubscriptRegex = /([A-Z][a-z]?|\)|\])(\d+)(?![0-9]*[KkgmML\u207B\u207A⁻⁺])/g;
  result = result.replace(chemicalSubscriptRegex, (match, prefix, numStr) => {
    const subDigits = numStr.split('').map((d: string) => SUB_MAP[d] || d).join('');
    return prefix + subDigits;
  });

  return result;
}

/**
 * Auto-formats scientific notation powers and negative exponents:
 * e.g. "10^-1 nm" -> "10⁻¹ nm"
 * e.g. "10^-2 nm" -> "10⁻² nm"
 * e.g. "10^-3 nm" -> "10⁻³ nm"
 * e.g. "10^-4 pm" -> "10⁻⁴ pm"
 * e.g. "10^-6 μm" -> "10⁻⁶ μm"
 * e.g. "10^-10 Å" -> "10⁻¹⁰ Å"
 * e.g. "5×10^-3 m" -> "5×10⁻³ m"
 * e.g. "2.5×10^6 kg" -> "2.5×10⁶ kg"
 */
export function autoFormatScientificExponents(text: string): string {
  if (!text) return '';
  let result = text;

  // Format Ka, Kb, Ksp constant subscripts
  result = result.replace(/\bK\s*([ab]|sp)\b/g, (match, sub) => `K${convertToSubscript(sub)}`);

  // All minus & dash characters: ASCII hyphen -, Unicode minus − (\u2212), En-dash – (\u2013), Em-dash — (\u2014), Superscript minus ⁻ (\u207B)
  const minusChars = '[+\\-–—\\u2212\\u2010-\\u2015\\u207B\\u207A]';

  // 1. Convert base WITH CARET ^ (with or without minus, spaces, or superscripts)
  // e.g. 10^-1, 10^-2, 10^-3, 10^-4, 10^-5, 10^-6, 10^-10, 10^5, 10^6, 5x10^-3, 2.5x10^6
  const caretRegex = new RegExp(`(\\d+|[a-zA-Z]|\\))\\s*\\^\\s*(${minusChars})?\\s*([0-9⁰¹²³⁴⁵⁶⁷⁸⁹]+)`, 'gi');
  result = result.replace(caretRegex, (_, base, sign, numStr) => {
    let supSign = '';
    if (sign) {
      supSign = (sign === '+' || sign === '⁺') ? '⁺' : '⁻';
    }
    const cleanDigits = numStr.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d: string) => {
      const idx = '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(d);
      return idx !== -1 ? String(idx) : d;
    });
    const supDigits = cleanDigits.split('').map((d: string) => SUPER_MAP[d] || d).join('');
    return base + (supSign || '') + supDigits;
  });

  // 2. Convert base WITH CARET ^ followed by dangling superscript string (e.g. 10^−³, 10^⁻³, 10^³):
  const danglingCaretRegex = new RegExp(`(\\d+|[a-zA-Z]|\\))\\s*\\^\\s*(${minusChars})?\\s*([⁻⁺⁰¹²³⁴⁵⁶⁷⁸⁹]+)`, 'gi');
  result = result.replace(danglingCaretRegex, (_, base, sign, supStr) => {
    let cleanSup = supStr;
    if (sign && !supStr.startsWith('⁻') && !supStr.startsWith('⁺')) {
      const supSign = (sign === '+' || sign === '⁺') ? '⁺' : '⁻';
      cleanSup = supSign + supStr;
    }
    return base + cleanSup;
  });

  // 3. Convert 10 or base WITHOUT CARET followed by minus and number (e.g. 10−4, 10-4, 10−⁴, 10- 4, 10− ⁴):
  // e.g. (4) 10−⁴ nm -> (4) 10⁻⁴ nm, 10-5 -> 10⁻⁵
  const directMinusRegex = new RegExp(`(\\b10)\\s*(${minusChars})\\s*([0-9⁰¹²³⁴⁵⁶⁷⁸⁹]+)(?![a-zA-Z0-9])`, 'gi');
  result = result.replace(directMinusRegex, (_, base, sign, numStr) => {
    const supSign = (sign === '+' || sign === '⁺') ? '⁺' : '⁻';
    const cleanDigits = numStr.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d: string) => {
      const idx = '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(d);
      return idx !== -1 ? String(idx) : d;
    });
    const supDigits = cleanDigits.split('').map((d: string) => SUPER_MAP[d] || d).join('');
    return base + supSign + supDigits;
  });

  // 4. Format multiplication sign in scientific notation: 1.8 x 10 -> 1.8 × 10, 5x10 -> 5×10
  result = result.replace(/(\d)\s*[xX*×]\s*(10[⁻⁺⁰¹²³⁴⁵⁶⁷⁸⁹\^])/g, '$1×$2');

  return result;
}

/**
 * Helper to strip balanced outer parentheses from an expression.
 */
function stripOuterParens(str: string): string {
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
 * Checks if a matched A / B string is an English "or" text slash rather than a mathematical fraction.
 */
function isEnglishOrSlash(numStr: string, denStr: string, fullStr: string, offset: number, match: string): boolean {
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

    // If either word is a trig/math function (e.g. sin, cos), it IS a fraction
    if (mathFunctions.has(numLow) || mathFunctions.has(denLow)) {
      return false;
    }

    // If either word is a physics formula quantity (e.g. distance/time), it IS a fraction
    if (physicsQuantities.has(numLow) || physicsQuantities.has(denLow)) {
      return false;
    }

    // If string contains an equals sign '=' (e.g. Rate = change/time), it IS a fraction formula
    if (fullStr.includes('=')) {
      return false;
    }

    // Otherwise, two plain English words separated by '/' represent English slash "or" (e.g., input/output, pass/fail)
    return true;
  }

  return false;
}

/**
 * Converts mathematical fractions into internal LaTeX format (\frac{numerator}{denominator}).
 */
export function convertToLatexFractions(text: string): string {
  if (!text) return '';
  let result = text;

  // Process Word Equation OMML tags (<m:f>, <m:num>, <m:den>)
  result = result.replace(/<m:f[^>]*>[\s\S]*?<m:num[^>]*>([\s\S]*?)<\/m:num>[\s\S]*?<m:den[^>]*>([\s\S]*?)<\/m:den>[\s\S]*?<\/m:f>/gi, (_, numXml, denXml) => {
    const numText = numXml.replace(/<[^>]+>/g, '').trim();
    const denText = denXml.replace(/<[^>]+>/g, '').trim();
    return `\\frac{${numText}}{${denText}}`;
  });

  // Auto subscript variables with single digit indices (e.g. x1 -> x_1, x2 -> x_2, y1 -> y_1, y2 -> y_2)
  result = result.replace(/\b([a-zA-Z])([1-9])\b/g, '$1_$2');

  const operandPattern = '(?:\\((?:[^()]|\\([^()]*\\))*\\)|[a-zA-Z0-9⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻°±α-ωΑ-Ω×÷\\^\\_]+(?:[+\\-–—\\u2212\\*×\\^][a-zA-Z0-9⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉⁺⁻°±α-ωΑ-Ω×÷\\^\\_]+)*)';
  const fractionRegex = new RegExp(`(${operandPattern})\\s*\\/\\s*(${operandPattern})`, 'g');

  result = result.replace(fractionRegex, (match, rawNum, rawDen, offset, fullStr) => {
    if (isEnglishOrSlash(rawNum, rawDen, fullStr, offset, match)) {
      return match;
    }
    let numStr = stripOuterParens(rawNum);
    let denStr = stripOuterParens(rawDen);

    return `\\frac{${numStr}}{${denStr}}`;
  });

  return result;
}

/**
 * Auto-formats fractions (e.g. 1/2, a/b, (a+b)/(c+d), 10⁻³/10⁻⁵, Na⁺/Cl⁻, \frac{a}{b})
 * into true stacked LaTeX fractions for professional equation rendering.
 */
export function autoFormatStackedFractions(text: string): string {
  if (!text) return '';
  return convertToLatexFractions(text);
}

/**
 * Normalizes spacing between scientific notation / numbers with exponents and units.
 * Ensures exactly one normal space between scientific notation and supported units.
 * Supported units: nm, pm, mm, cm, m, km, μm, µm, Å, A°, L, mL, kg, g, mg, mol, M, N, J, Pa, Hz, W, V, A, Ω, K, °C, etc.
 */
export function normalizeUnitSpacing(text: string): string {
  if (!text) return '';
  let result = text;

  // List of scientific units
  const unitsRegex = '(?:nm|pm|mm|cm|km|μm|µm|Å|A°|mL|kg|mg|mol|Pa|Hz|°C|Ω)';

  // 1. Fix scientific notation directly attached to unit without space (e.g. 10⁻³nm -> 10⁻³ nm)
  const attachedUnitRegex = new RegExp(`([0-9⁻⁺⁰¹²³⁴⁵⁶⁷⁸⁹]+)(${unitsRegex})(?![a-zA-Z0-9])`, 'g');
  result = result.replace(attachedUnitRegex, '$1 $2');

  // 2. Fix multiple spaces before unit (e.g. 10⁻³   nm -> 10⁻³ nm)
  const multiSpaceUnitRegex = new RegExp(`([0-9⁻⁺⁰¹²³⁴⁵⁶⁷⁸⁹]+)\\s{2,}(${unitsRegex})(?![a-zA-Z0-9])`, 'g');
  result = result.replace(multiSpaceUnitRegex, '$1 $2');

  // 3. Fix spaces between base and superscript exponent: e.g. 10 ⁻³ -> 10⁻³, 10⁻ ³ -> 10⁻³
  result = result.replace(/(\b10|\b[a-zA-Z]|\))\s+([⁻⁺⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, '$1$2');
  result = result.replace(/([⁻⁺])\s+([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g, '$1$2');

  return result;
}

/**
 * Intelligently joins accidental hard line breaks caused by Word/PDF column margins,
 * keeping real bullet/numbered statement lines separate.
 */
export function cleanLineBreaks(text: string): string {
  if (!text) return '';

  const lines = text.split('\n');
  const cleanedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const current = lines[i].trim();
    if (!current) {
      cleanedLines.push('');
      continue;
    }

    if (cleanedLines.length > 0) {
      const prevIndex = cleanedLines.length - 1;
      const prev = cleanedLines[prevIndex];

      const isNewItemHeader = /^(?:\([iivxlc\d]+\)|\b[iivxlc\d]+\.|\([a-z]\)|[a-z]\.|\d+\.|Option\s+[A-Z]:?|Statement\s+[I|\d]+:?|Assertion|Reason)\b/i.test(current);
      const prevEndsSentence = /[.:;?!]$/.test(prev);

      if (prev && !prevEndsSentence && !isNewItemHeader) {
        cleanedLines[prevIndex] = prev + ' ' + current;
        continue;
      }
    }

    cleanedLines.push(current);
  }

  return cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n');
}

/**
 * Main centralized formatting pipeline for copied or typed scientific text
 */
export function formatCleanText(text: string): string {
  if (!text) return '';
  let res = text;
  res = autoFormatIonicChargesAndChemistry(res);
  res = autoFormatScientificExponents(res);
  res = autoFormatStackedFractions(res);
  res = normalizeUnitSpacing(res);
  return res;
}

/**
 * Parses copied HTML / Rich text content and converts subscripts, superscripts,
 * math entities, chemical formulas, and line breaks into clean Unicode text.
 */
export function parseRichTextToUnicode(htmlText: string): string {
  if (!htmlText) return '';

  let cleaned = htmlText;

  // 1. Process MS Word Equation OMML tags (<m:f> fraction, <m:num> numerator, <m:den> denominator) before stripping XML
  cleaned = cleaned.replace(/<m:f[^>]*>[\s\S]*?<m:num[^>]*>([\s\S]*?)<\/m:num>[\s\S]*?<m:den[^>]*>([\s\S]*?)<\/m:den>[\s\S]*?<\/m:f>/gi, (_, numXml, denXml) => {
    const numText = numXml.replace(/<[^>]+>/g, '').trim();
    const denText = denXml.replace(/<[^>]+>/g, '').trim();
    return `(${numText})/(${denText})`;
  });

  // 1b. Process OMML superscripts (<m:sSup>) and subscripts (<m:sSub>) before stripping tags
  cleaned = cleaned.replace(/<m:sSup[^>]*>[\s\S]*?<m:e[^>]*>([\s\S]*?)<\/m:e>[\s\S]*?<m:sup[^>]*>([\s\S]*?)<\/m:sup>[\s\S]*?<\/m:sSup>/gi, (_, baseXml, supXml) => {
    const baseText = baseXml.replace(/<[^>]+>/g, '').trim();
    const supText = supXml.replace(/<[^>]+>/g, '').trim();
    return `${baseText}^${supText}`;
  });

  cleaned = cleaned.replace(/<m:sSub[^>]*>[\s\S]*?<m:e[^>]*>([\s\S]*?)<\/m:e>[\s\S]*?<m:sub[^>]*>([\s\S]*?)<\/m:sub>[\s\S]*?<\/m:sSub>/gi, (_, baseXml, subXml) => {
    const baseText = baseXml.replace(/<[^>]+>/g, '').trim();
    const subText = subXml.replace(/<[^>]+>/g, '').trim();
    return `${baseText}_${subText}`;
  });

  // 1c. Strip XML comments, style, script, head, meta, link, title, and xml wrappers without deleting inner text of Word/Office tags
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/gi, '');
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<xml[^>]*>[\s\S]*?<\/xml>/gi, '');
  cleaned = cleaned.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
  cleaned = cleaned.replace(/<meta[^>]*>/gi, '');
  cleaned = cleaned.replace(/<link[^>]*>/gi, '');
  cleaned = cleaned.replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '');

  // 2. Replace <sub>...</sub> tags
  cleaned = cleaned.replace(/<sub[^>]*>(.*?)<\/sub>/gi, (_, content) => {
    const plain = content.replace(/<[^>]+>/g, '');
    return convertToSubscript(plain);
  });

  // 3. Replace <sup>...</sup> tags
  cleaned = cleaned.replace(/<sup[^>]*>(.*?)<\/sup>/gi, (_, content) => {
    const plain = content.replace(/<[^>]+>/g, '');
    return convertToSuperscript(plain);
  });

  // 4. Replace math entities & common symbols
  cleaned = cleaned
    .replace(/&plusmn;/gi, '±')
    .replace(/&times;/gi, '×')
    .replace(/&divide;/gi, '÷')
    .replace(/&le;/gi, '≤')
    .replace(/&ge;/gi, '≥')
    .replace(/&ne;/gi, '≠')
    .replace(/&approx;/gi, '≈')
    .replace(/&infin;/gi, '∞')
    .replace(/&radic;/gi, '√')
    .replace(/&deg;/gi, '°')
    .replace(/&alpha;/gi, 'α')
    .replace(/&beta;/gi, 'β')
    .replace(/&gamma;/gi, 'γ')
    .replace(/&delta;/gi, 'δ')
    .replace(/&theta;/gi, 'θ')
    .replace(/&lambda;/gi, 'λ')
    .replace(/&mu;/gi, 'μ')
    .replace(/&pi;/gi, 'π')
    .replace(/&sigma;/gi, 'σ')
    .replace(/&omega;/gi, 'ω')
    .replace(/&Delta;/gi, 'Δ')
    .replace(/&Omega;/gi, 'Ω')
    .replace(/&rarr;/gi, '→')
    .replace(/&harr;/gi, '↔')
    .replace(/&rArr;/gi, '⇒');

  // 5. Convert line breaks and paragraph ends
  cleaned = cleaned
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/li>/gi, '\n');

  // 6. Strip remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');

  // 7. Decode common HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  return formatCleanText(cleaned);
}

/**
 * Enhanced paste handler for input & textarea fields that handles rich text,
 * subscripts, superscripts, math formulas, line breaks, and images seamlessly.
 */
export function handleRichPaste(
  e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  currentValue: string,
  setValue: (newVal: string) => void
): boolean {
  const htmlData = e.clipboardData?.getData('text/html');
  const plainData = e.clipboardData?.getData('text/plain');

  const hasTextData = (plainData && plainData.trim().length > 0) || (htmlData && htmlData.trim().length > 0);

  if (hasTextData) {
    let rawText = '';
    
    if (htmlData && htmlData.trim().length > 0) {
      rawText = parseRichTextToUnicode(htmlData);
    }

    if (!rawText && plainData) {
      rawText = formatCleanText(plainData);
    }

    if (rawText) {
      e.preventDefault();
      insertTextAtCursor(e.currentTarget, rawText, currentValue, setValue);
      return true;
    }
  }

  const items = e.clipboardData?.items;
  if (items) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        return false;
      }
    }
  }

  return false;
}

export function insertTextAtCursor(
  target: HTMLInputElement | HTMLTextAreaElement,
  textToInsert: string,
  currentValue: string,
  setValue: (newVal: string) => void
) {
  const start = target.selectionStart ?? currentValue.length;
  const end = target.selectionEnd ?? currentValue.length;
  const newValue = currentValue.substring(0, start) + textToInsert + currentValue.substring(end);
  setValue(newValue);
  
  setTimeout(() => {
    target.focus();
    target.setSelectionRange(start + textToInsert.length, start + textToInsert.length);
  }, 0);
}
