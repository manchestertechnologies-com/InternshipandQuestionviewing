/**
 * Physics Parser Engine
 * =====================
 * Handles physics-specific rendering for the question editor.
 *
 * Key behaviors:
 * - Greek symbols (ω, μ, α, β, θ, λ, π, Δ) in physics context
 *   are wrapped in $...$ so KaTeX renders them correctly.
 * - Vectors (\vec{E}, \hat{i}) are preserved and wrapped.
 * - Scientific notation (3.0 × 10⁸) is rendered via KaTeX.
 * - Unit fractions (rad/s, m/s², N/m²) are NOT converted to fractions.
 * - Physics equations (F = ma, v = u + at) are wrapped in math mode.
 *
 * Output: string with math segments in $...$ for KaTeX rendering.
 * Non-math prose is left untouched.
 */

import { smartConvertRaw, normalizeLatexShortcuts } from '@/lib/mathParser';

// Physics unit fractions that should NOT be converted to \frac{}{}
const PHYSICS_UNIT_FRACTIONS = new Set([
  'rad/s', 'm/s', 'm/s²', 'km/h', 'km/hr', 'N/m', 'N/m²',
  'J/s', 'W/m²', 'kg/m³', 'mol/L', 'C/m²', 'V/m', 'A/m',
  'Wb/m²', 'T·m²', 'N·m', 'J/K', 'W/(m·K)',
]);

/**
 * Checks if text contains physics-specific notation.
 */
export function isPhysicsContent(text: string): boolean {
  // Greek letters commonly used in physics
  if (/[αβγδεθλμπσφχωΔΩ]/.test(text)) return true;
  // LaTeX physics commands
  if (/\\(?:vec|hat|omega|alpha|beta|mu|Delta|lambda|theta|pi)\b/.test(text)) return true;
  // Physics quantities
  if (/\b(velocity|acceleration|force|mass|momentum|impedance|resistance|capacitance|inductance|wavelength|frequency|torque|refractive|gravitational|kinetic|potential)\b/i.test(text)) return true;
  // Scientific notation
  if (/\d\s*[×x]\s*10/.test(text)) return true;
  // Vector notation
  if (/[a-zA-Z]\s*[⃗̂]/.test(text)) return true;
  return false;
}

/**
 * Main physics render pipeline.
 * Delegates to smartConvertRaw which handles Greek letter to KaTeX conversion,
 * but first ensures unit fractions are protected from fraction conversion.
 */
export function parsePhysics(text: string): string {
  if (!text) return '';

  // Protect unit fractions by marking them
  const protected_text = text.replace(
    /\b([\w·]+\/[\w·²³⁻]+)\b/g,
    (match) => {
      if (PHYSICS_UNIT_FRACTIONS.has(match)) {
        return `__UNIT_${match.replace(/\//g, '_SLASH_')}__`;
      }
      return match;
    }
  );

  // Run the full math conversion pipeline
  const converted = smartConvertRaw(normalizeLatexShortcuts(protected_text));

  // Restore protected unit fractions
  return converted.replace(/__UNIT_([\w·]+)_SLASH_([\w·²³⁻]+)__/g, '$1/$2');
}
