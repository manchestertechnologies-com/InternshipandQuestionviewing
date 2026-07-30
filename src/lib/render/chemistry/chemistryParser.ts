/**
 * Chemistry Parser Engine
 * ========================
 * CRITICAL: This parser outputs UNICODE ONLY.
 * It NEVER produces LaTeX \text{}, ^{}, _{} output.
 *
 * Strategy: Use placeholder markers to protect ionic charges from subscript conversion.
 * Order:
 *   1. Convert arrows
 *   2. Convert electron configs
 *   3. Convert all ionic charges → Unicode, replace with placeholder
 *   4. Convert formula subscripts safely
 *   5. No placeholders needed — direct Unicode output
 *
 * Test cases (all must produce UNICODE, no LaTeX):
 *   NH4+      → NH₄⁺
 *   SO4^2-    → SO₄²⁻
 *   Fe3+      → Fe³⁺    (3 is charge magnitude, NOT subscript)
 *   Ca2+      → Ca²⁺    (2 is charge magnitude, NOT subscript)
 *   TiF6^2-   → TiF₆²⁻
 *   CoF6^3-   → CoF₆³⁻
 *   NiCl4^2-  → NiCl₄²⁻
 *   Cr2O7^2-  → Cr₂O₇²⁻
 *   Cl-       → Cl⁻
 *   Na+       → Na⁺
 *   H2O       → H₂O
 *   CO2       → CO₂
 *   1s^2      → 1s²
 *   ->        → →
 *   <->       → ⇌
 */

const SUB_MAP: Record<string, string> = {
  '0':'₀','1':'₁','2':'₂','3':'₃','4':'₄',
  '5':'₅','6':'₆','7':'₇','8':'₈','9':'₉',
};
const SUP_MAP: Record<string, string> = {
  '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴',
  '5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹',
};

const toSub = (s: string) => s.split('').map(c => SUB_MAP[c] ?? c).join('');
const toSup = (s: string) => s.split('').map(c => SUP_MAP[c] ?? c).join('');

/** Convert a charge like "2-", "+", "3+" to Unicode superscript */
function chargeSup(charge: string): string {
  const c = charge.replace(/[()]/g, '').trim();
  // "2-" "3+" "+2" "-3" "+" "-"
  let digits = '', sign = '';
  const m1 = c.match(/^(\d+)([+\-])$/);
  const m2 = c.match(/^([+\-])(\d*)$/);
  if (m1) { digits = m1[1]; sign = m1[2]; }
  else if (m2) { sign = m2[1]; digits = m2[2]; }
  else return charge;
  return (digits ? toSup(digits) : '') + (sign === '+' ? '⁺' : '⁻');
}

/**
 * Monoatomic metal/nonmetal ions where the number before +/- is
 * the CHARGE MAGNITUDE (superscript), not a formula count (subscript).
 * Fe3+ = iron ion with 3+ charge → Fe³⁺
 * Ca2+ = calcium with 2+ charge → Ca²⁺
 */
const MONOATOMIC = new Set([
  'Fe','Cu','Ca','Mg','Al','Na','K','Li','Ag','Pb','Hg','Sn',
  'Zn','Ba','Cr','Ni','Co','Mn','Ti','V','Rb','Cs','Sr','Ra',
  'Bi','Sb','W','Mo','Pt','Au','Rh','Pd','Ir','Os','Ru',
  'Cl','Br','F','I','S','O','N','P','H',
]);

function processCoreChemistry(text: string): string {
  let r = text;

  // 1. Arrows
  r = r.replace(/<->/g,'⇌').replace(/<=>/g,'⇌').replace(/->/g,'→').replace(/→→/g,'→');

  // 2. Electron config: 1s^2, 2p^6, 3d^(10)
  r = r.replace(/\b(\d[spdf])\s*\^\((\d+)\)/g, (_,o,e) => o + toSup(e));
  r = r.replace(/\b(\d[spdf])\s*\^(\d+)/g, (_,o,e) => o + toSup(e));

  // 3a. Polyatomic ions with EXPLICIT CARET: Formula + digit + ^charge
  //     e.g. SO4^2- → SO₄²⁻, TiF6^2- → TiF₆²⁻, Cr2O7^2- → Cr₂O₇²⁻
  //     The digit BEFORE the caret is a SUBSCRIPT (formula count)
  r = r.replace(
    /([A-Z][a-zA-Z0-9]*?)(\d+)\s*\^\s*\(?\s*(\d+[+\-]|[+\-]\d*|[+\-])\s*\)?/g,
    (_, formula, subDigit, charge) => formula + toSub(subDigit) + chargeSup(charge)
  );

  // 3b. Monoatomic ions with EXPLICIT CARET: Elem^charge
  //     e.g. Fe^3+ → Fe³⁺, Ca^2+ → Ca²⁺, Cl^- → Cl⁻
  r = r.replace(
    /([A-Z][a-z]?)\s*\^\s*\(?\s*(\d+[+\-]|[+\-]\d*|[+\-])\s*\)?/g,
    (_, elem, charge) => elem + chargeSup(charge)
  );

  // 3c. Monoatomic ions WITHOUT caret, WITH digit before sign: Fe3+, Ca2+, Al3+
  //     The digit is CHARGE MAGNITUDE (superscript), not subscript
  //     Pattern: known-monoatomic-element + digits + sign (no letters after sign)
  r = r.replace(
    /\b([A-Z][a-z]?)(\d+)([+\-])(?=[^a-zA-Z]|$)/g,
    (match, elem, num, sign) => {
      if (MONOATOMIC.has(elem)) {
        return elem + toSup(num) + (sign === '+' ? '⁺' : '⁻');
      }
      // Polyatomic-formula + digit + sign (e.g. last element+digit before sign)
      // Treat digit as subscript
      return elem + toSub(num) + (sign === '+' ? '⁺' : '⁻');
    }
  );

  // 3d. Polyatomic/multi-element formula ending in digit+sign: NH4+, SO42-
  //     Pattern: compound (2+ uppercase) + digits + sign
  r = r.replace(
    /\b([A-Z][a-z]?(?:[A-Z][a-z]?\d*)+)(\d+)([+\-])(?=[^a-zA-Z]|$)/g,
    (_, formula, digits, sign) => formula + toSub(digits) + (sign === '+' ? '⁺' : '⁻')
  );

  // 3e. Monoatomic ions NO digit, NO caret: Cl-, Na+, K+, H+
  //     Only matches if not followed by a letter or digit (avoid false matches)
  r = r.replace(
    /\b([A-Z][a-z]?)([+\-])(?=[^a-zA-Z0-9]|$)/g,
    (match, elem, sign) => {
      if (MONOATOMIC.has(elem)) return elem + (sign === '+' ? '⁺' : '⁻');
      return match;
    }
  );

  // 4. Formula subscripts (LAST): H2O → H₂O, CO2 → CO₂, C6H12O6 → C₆H₁₂O₆
  //    Only convert digit after element IF NOT already Unicode and NOT followed by +/-
  r = r.replace(
    /([A-Z][a-z]?)(\d+)(?![⁺⁻₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹+\-])/g,
    (match, elem, num) => {
      if (/[₀₁₂₃₄₅₆₇₈₉⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(match)) return match;
      return elem + toSub(num);
    }
  );

  return r;
}

/** Detect if text segment is chemistry content */
export function isChemistrySegment(text: string): boolean {
  if (/[A-Z][a-z]?\d+/.test(text)) return true;
  if (/[A-Z][a-z]?[\^]?\d*[+\-]/.test(text)) return true;
  if (/\^\s*\(?\d*[+\-]/.test(text)) return true;
  if (/->|<->|<=>/.test(text)) return true;
  if (/\d[spdf]\^?\d+/.test(text)) return true;
  if (/\b(oxidation|reduction|mol|molarity|pH|catalyst|orbital|valency|ionic|covalent)\b/i.test(text)) return true;
  return false;
}

/** Main entry: parse chemistry text to Unicode */
export function parseChemistry(text: string): string {
  if (!text) return '';
  return text.split('\n').map(line => line.trim() ? processCoreChemistry(line) : line).join('\n');
}

/** Validate no LaTeX leaked through */
export function hasRawLatex(text: string): boolean {
  return /\\(?:text|frac|sqrt|sum|int|alpha|beta|mu|omega|Delta)\{/.test(text) ||
    /\^\{[^}]*\}/.test(text) ||
    /\_\{[^}]*\}/.test(text);
}
