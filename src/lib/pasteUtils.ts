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
 * Auto-formats chemical formulas, organic chemistry structures, and temperature units
 * into exact subscript and superscript representations.
 * e.g. "PCl3, PBr3, PI3" -> "PCl₃, PBr₃, PI₃"
 * e.g. "SOCl2, PCl5" -> "SOCl₂, PCl₅"
 * e.g. "H2SO4 /HNO3" -> "H₂SO₄ /HNO₃"
 * e.g. "(CH3CO)2O /AlCl3" -> "(CH₃CO)₂O /AlCl₃"
 */
export function autoFormatChemicalSubscripts(text: string): string {
  if (!text) return '';

  let result = text;

  // 1. Format temperatures like 0-50C, 0-5^0C, 0-5oC -> 0-5°C
  result = result.replace(/(\d+)\s*(?:[0o⁰]C|°C|\^0C)/g, '$1°C');
  result = result.replace(/(\d+)-(\d+)\s*0C/gi, '$1-$2°C');

  // 2. Periodic Table & Group Element Symbols regex
  // Match Element Symbol (e.g. Fe, Cu, Cl, Br, Na, H, O, C, P, S, N, F, Al, Zn, Hg, Sb, Co, B, I) 
  // OR closing bracket/parenthesis ')', ']', followed by digits 1-99
  // Avoid matching Kelvin/Celsius/gram/mL/meter/molar units like 623K, 100g, 50mL
  const chemicalSubscriptRegex = /([A-Z][a-z]?|\)|\])(\d+)(?![0-9]*[KkgmML])/g;

  result = result.replace(chemicalSubscriptRegex, (match, prefix, numStr) => {
    // Convert numStr to Unicode subscripts
    const subDigits = numStr.split('').map((d: string) => SUB_MAP[d] || d).join('');
    return prefix + subDigits;
  });

  return result;
}

/**
 * Parses copied HTML / Rich text content and converts subscripts, superscripts,
 * math entities, chemical formulas, and line breaks into clean Unicode text.
 */
export function parseRichTextToUnicode(htmlText: string): string {
  if (!htmlText) return '';

  let cleaned = htmlText;

  // Replace <sub>...</sub> tags
  cleaned = cleaned.replace(/<sub[^>]*>(.*?)<\/sub>/gi, (_, content) => {
    const plain = content.replace(/<[^>]+>/g, '');
    return convertToSubscript(plain);
  });

  // Replace <sup>...</sup> tags
  cleaned = cleaned.replace(/<sup[^>]*>(.*?)<\/sup>/gi, (_, content) => {
    const plain = content.replace(/<[^>]+>/g, '');
    return convertToSuperscript(plain);
  });

  // Replace math entities & common symbols
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

  // Convert line breaks and paragraph ends
  cleaned = cleaned
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n');

  // Strip remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '');

  // Decode common HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // Normalize multiple newlines (max 2 consecutive)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  return autoFormatChemicalSubscripts(cleaned.trim());
}

/**
 * Enhanced paste handler for input & textarea fields that handles rich text,
 * subscripts, superscripts, math formulas, and images seamlessly.
 */
export function handleRichPaste(
  e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  currentValue: string,
  setValue: (newVal: string) => void
): boolean {
  // If clipboard contains an image file, let the caller handle image paste
  const items = e.clipboardData?.items;
  if (items) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        return false; // Handled as image paste
      }
    }
  }

  const htmlData = e.clipboardData?.getData('text/html');
  const plainData = e.clipboardData?.getData('text/plain');

  if (htmlData && (htmlData.includes('<sub') || htmlData.includes('<sup') || htmlData.includes('&') || htmlData.includes('<p>') || htmlData.includes('<math'))) {
    let formatted = parseRichTextToUnicode(htmlData);
    formatted = autoFormatChemicalSubscripts(formatted);
    if (formatted) {
      e.preventDefault();
      insertTextAtCursor(e.currentTarget, formatted, currentValue, setValue);
      return true;
    }
  }

  if (plainData) {
    let formatted = plainData;
    if (plainData.includes('<sub>') || plainData.includes('<sup>')) {
      formatted = parseRichTextToUnicode(plainData);
    }
    const chemFormatted = autoFormatChemicalSubscripts(formatted);
    if (chemFormatted !== plainData) {
      e.preventDefault();
      insertTextAtCursor(e.currentTarget, chemFormatted, currentValue, setValue);
      return true;
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
