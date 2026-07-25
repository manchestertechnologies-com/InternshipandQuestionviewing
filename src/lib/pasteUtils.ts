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
 * Auto-formats scientific notation powers and negative exponents:
 * e.g. "(1) 10^−³ nm" -> "(1) 10⁻³ nm"
 * e.g. "(2) 10^−¹ nm" -> "(2) 10⁻¹ nm"
 * e.g. "(3) 10^−² nm" -> "(3) 10⁻² nm"
 * e.g. "(4) 10−⁴ nm" -> "(4) 10⁻⁴ nm"
 * e.g. "10^-5" -> "10⁻⁵"
 * e.g. "10^- 5" -> "10⁻⁵"
 * e.g. "1.8 x 10^-5" -> "1.8 × 10⁻⁵"
 * e.g. "Ka" -> "Kₐ"
 */
export function autoFormatScientificExponents(text: string): string {
  if (!text) return '';
  let result = text;

  // Format Ka, Kb, Ksp constant subscripts
  result = result.replace(/\bK\s*([ab]|sp)\b/g, (match, sub) => `K${convertToSubscript(sub)}`);

  // All minus & dash characters: ASCII hyphen -, Unicode minus − (\u2212), En-dash – (\u2013), Em-dash — (\u2014), Superscript minus ⁻ (\u207B)
  const minusChars = '[+\\-–—\\u2212\\u2010-\\u2015\\u207B\\u207A]';

  // 1. Convert base WITH CARET ^ (with or without minus, spaces, or superscripts)
  // e.g. 10^-3, 10^ -3, 10^−3, 10^ −³, 10^−³, (2) 10^ −¹ -> 10⁻³, 10⁻³, 10⁻³, 10⁻³, (2) 10⁻¹
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
  const directMinusRegex = new RegExp(`(\\b10|\\b[a-zA-Z])\\s*(${minusChars})\\s*([0-9⁰¹²³⁴⁵⁶⁷⁸⁹]+)(?![a-zA-Z0-9])`, 'gi');
  result = result.replace(directMinusRegex, (_, base, sign, numStr) => {
    const supSign = (sign === '+' || sign === '⁺') ? '⁺' : '⁻';
    const cleanDigits = numStr.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (d: string) => {
      const idx = '⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(d);
      return idx !== -1 ? String(idx) : d;
    });
    const supDigits = cleanDigits.split('').map((d: string) => SUPER_MAP[d] || d).join('');
    return base + supSign + supDigits;
  });

  // 4. Format multiplication sign in scientific notation: 1.8 x 10 -> 1.8 × 10
  result = result.replace(/(\d)\s*[xX]\s*(10[⁻⁺⁰¹²³⁴⁵⁶⁷⁸⁹\^])/g, '$1 × $2');

  return result;
}

/**
 * Auto-formats chemical formulas, organic chemistry structures, and temperature units
 * into exact subscript and superscript representations.
 */
export function autoFormatChemicalSubscripts(text: string): string {
  if (!text) return '';

  let result = text;

  // 1. Format temperatures like 0-50C, 0-5^0C, 0-5oC -> 0-5°C
  result = result.replace(/(\d+)\s*(?:[0o⁰]C|°C|\^0C)/g, '$1°C');
  result = result.replace(/(\d+)-(\d+)\s*0C/gi, '$1-$2°C');

  // 2. Periodic Table & Group Element Symbols regex
  const chemicalSubscriptRegex = /([A-Z][a-z]?|\)|\])(\d+)(?![0-9]*[KkgmML])/g;

  result = result.replace(chemicalSubscriptRegex, (match, prefix, numStr) => {
    const subDigits = numStr.split('').map((d: string) => SUB_MAP[d] || d).join('');
    return prefix + subDigits;
  });

  return result;
}

/**
 * Auto-formats ionic charges, exponents, powers, and carets
 * e.g. Ca2+ -> Ca²⁺, Na+ -> Na⁺, S2- / S2^-- -> S²⁻, Se2^-- -> Se²⁻, 10^-3 -> 10⁻³, x^2 -> x²
 */
export function autoFormatPowersAndCharges(text: string): string {
  if (!text) return '';
  let result = text;

  // 1. Clean up caret power charges with existing Unicode superscripts/subscripts or digits:
  // e.g. S²^--, Se²^--, S2^--, S^2--, S₂^--, S2-- -> S²⁻, Se²⁻
  result = result.replace(/([A-Z][a-z]?|\)|\])[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉\d]*\^?--+/gi, (match, elem) => {
    if (match.includes('3') || match.includes('³') || match.includes('₃')) return elem + '³⁻';
    return elem + '²⁻';
  });

  result = result.replace(/([A-Z][a-z]?|\)|\])[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉\d]*\^?\+\++/gi, (match, elem) => {
    if (match.includes('3') || match.includes('³') || match.includes('₃')) return elem + '³⁺';
    return elem + '²⁺';
  });

  // 2. Format explicitly written caret powers like x^2 -> x², 10^-3 -> 10⁻³, S^2- -> S²⁻
  result = result.replace(/\^([0-9\+\-\=\(\)a-z]+)/gi, (_, p1) => {
    return convertToSuperscript(p1);
  });

  // 3. Format ionic charges with digits: Ca2+ -> Ca²⁺, S2- -> S²⁻, Fe3+ -> Fe³⁺
  const chargeRegex = /([A-Z][a-z]?|\)|\]|[₀-₉])(\d+)([\+\-])(?![a-zA-Z0-9])/g;
  result = result.replace(chargeRegex, (match, elem, digits, sign) => {
    const supDigits = digits.split('').map((d: string) => SUPER_MAP[d] || d).join('');
    const supSign = sign === '+' ? '⁺' : '⁻';
    return elem + supDigits + supSign;
  });

  // 4. Format single ionic charges: Na+ -> Na⁺, Cl- -> Cl⁻
  const singleChargeRegex = /([A-Z][a-z]?|\)|\]|[₀-₉])([\+\-])(?![a-zA-Z0-9\+\-\=])/g;
  result = result.replace(singleChargeRegex, (match, elem, sign) => {
    const supSign = sign === '+' ? '⁺' : '⁻';
    return elem + supSign;
  });

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
 * Main formatting pipeline for copied or typed scientific text
 */
export function formatCleanText(text: string): string {
  if (!text) return '';
  let res = cleanLineBreaks(text);
  res = autoFormatScientificExponents(res);
  res = autoFormatPowersAndCharges(res);
  res = autoFormatChemicalSubscripts(res);
  return res.trim();
}

/**
 * Parses copied HTML / Rich text content and converts subscripts, superscripts,
 * math entities, chemical formulas, and line breaks into clean Unicode text.
 */
export function parseRichTextToUnicode(htmlText: string): string {
  if (!htmlText) return '';

  let cleaned = htmlText;

  // 1. Strip Word & Office XML namespace tags (<w:...>, <o:...>, <m:...>, <v:...>), comments, style, script, head, meta
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/gi, '');
  cleaned = cleaned.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<xml[^>]*>[\s\S]*?<\/xml>/gi, '');
  cleaned = cleaned.replace(/<[womv]:[^>]*>[\s\S]*?<\/[womv]:[^>]*>/gi, '');
  cleaned = cleaned.replace(/<[womv]:[^>]*\/>/gi, '');
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
    
    if (htmlData && (htmlData.includes('<sub') || htmlData.includes('<sup') || htmlData.includes('<math') || htmlData.includes('<p') || htmlData.includes('<div') || htmlData.includes('<xml'))) {
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
