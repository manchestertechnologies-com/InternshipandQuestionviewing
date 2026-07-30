import assert from 'node:assert';
import katex from 'katex';
import {
  normalizeLatexShortcuts,
  smartConvertRaw,
  normalizePostProcessing,
  textToLaTeX,
  normalizeLatexExpr
} from '../src/lib/mathParser';

console.log('==================================================');
console.log('STARTING EXTRACTION ENGINE & FORMATTER COMPREHENSIVE SUITE');
console.log('==================================================\n');

// 1. Post-Processing Normalization Tests
console.log('--- SECTION 1: POST-PROCESSING NORMALIZATION ---');
const nestedText = `[SOURCE TEXT / \\text{\\text{OPTION S}} UNREADABLE]`;
const cleanNested = normalizePostProcessing(nestedText);
assert.strictEqual(cleanNested.includes('\\text{\\text'), false, 'Must unwrap nested \\text{\\text}');
assert.strictEqual(cleanNested.includes('OPTION S'), true, 'Must preserve inner option text');
console.log('✔ Nested \\text{\\text{}} unwrapping verified:', cleanNested);

const duplicateDollar = `$$\\omega$$`;
const cleanDollar = smartConvertRaw(normalizeLatexShortcuts(duplicateDollar));
assert.strictEqual(cleanDollar, '$\\omega$', 'Must normalize $$\\omega$$ to \\omega');
console.log('✔ Duplicate $$ block delimiter removal verified:', cleanDollar);

const unclosedBrace = `\\sqrt{R^2 + (\\omega L)^2`;
const balancedBrace = normalizePostProcessing(unclosedBrace);
assert.strictEqual(balancedBrace.endsWith('}'), true, 'Must auto-balance unclosed brace');
console.log('✔ Delimiter & brace auto-repair verified:', balancedBrace);

// 2. Chemistry Formatter Tests
console.log('\n--- SECTION 2 & 3: CHEMISTRY FORMATTER ---');
const chemQ34 = `34. Amongst TiF6 ^(2-), CoF6^(3-), Cu^(2-) Cl and NiCl4^(2-) (At. No. Ti = 22, Co = 27, Cu = 29, Ni = 28), the colourless species are`;
const normChem = smartConvertRaw(normalizeLatexShortcuts(chemQ34));

assert.strictEqual(normChem.includes('TiF_{6}^{2-}'), true, 'TiF6 ^(2-) must convert to TiF_{6}^{2-}');
assert.strictEqual(normChem.includes('CoF_{6}^{3-}'), true, 'CoF6^(3-) must convert to CoF_{6}^{3-}');
assert.strictEqual(normChem.includes('NiCl_{4}^{2-}'), true, 'NiCl4^(2-) must convert to NiCl_{4}^{2-}');
console.log('✔ Chemistry complex ions & charges verified:', normChem);

const chemOptions = `(1) TiF6 ^(2-) and Cu2 Cl2
(2) Cu2 Cl2 and NiCl4^2`;
const normOptions = smartConvertRaw(normalizeLatexShortcuts(chemOptions));
assert.strictEqual(normOptions.includes('Cu_{2}Cl_{2}'), true, 'Cu2 Cl2 must convert to Cu_{2}Cl_{2}');
assert.strictEqual(normOptions.includes('NiCl_{4}^{2-}'), true, 'NiCl4^2 must convert to NiCl_{4}^{2-}');
console.log('✔ Chemistry stoichiometry & option carets verified:', normOptions);

// 3. Physics Formatter Tests
console.log('\n--- SECTION 4: PHYSICS FORMATTER ---');
const physicsInput = `Calculate impedance Z = sqrt(R2 + (wL - 1/wC)^2) when omega = 100 rad/s.`;
const normPhysics = smartConvertRaw(normalizeLatexShortcuts(physicsInput));
assert.strictEqual(normPhysics.includes('\\sqrt{'), true, 'sqrt() must convert to \\sqrt{}');
assert.strictEqual(normPhysics.includes('\\omega L'), true, 'wL must convert to \\omega L');
assert.strictEqual(normPhysics.includes('\\frac{1}{\\omega C}'), true, '1/wC must convert to \\frac{1}{\\omega C}');
console.log('✔ Physics impedance & variables verified:', normPhysics);

// 4. Mathematics Formatter Tests
console.log('\n--- SECTION 5: MATHEMATICS FORMATTER ---');
const mathInput = `Solve integral int sin2x dx and log2(x).`;
const normMath = smartConvertRaw(normalizeLatexShortcuts(mathInput));
assert.strictEqual(normMath.includes('\\sin'), true, 'sin must be prefixed with \\sin');
assert.strictEqual(normMath.includes('\\log'), true, 'log must be prefixed with \\log');
console.log('✔ Mathematics calculus & functions verified:', normMath);

// 5. Biology Formatter Tests
console.log('\n--- SECTION 6: BIOLOGY FORMATTER ---');
const bioInput = `Synthesis of ATP in mitochondria produces CO2 and H2O.`;
const normBio = smartConvertRaw(normalizeLatexShortcuts(bioInput));
assert.strictEqual(normBio.includes('ATP'), true, 'Biology text must remain plain text');
console.log('✔ Biology prose preservation verified:', normBio);

// 6. KaTeX Render Safety Check
console.log('\n--- SECTION 10 & 11: KATEX RENDER SAFETY CHECK ---');
const allMathMatches = [normChem, normOptions, normPhysics, normMath].flatMap(s => s.match(/\$[^$\n]+\$/g) || []);
let katexErrors = 0;
allMathMatches.forEach(m => {
  const expr = m.slice(1, -1).trim();
  const html = katex.renderToString(textToLaTeX(normalizeLatexExpr(expr)), { throwOnError: false });
  if (html.includes('katex-error')) {
    console.error('❌ KaTeX error on expr:', expr);
    katexErrors++;
  }
});

assert.strictEqual(katexErrors, 0, 'Zero KaTeX errors allowed across all formatted equations');
console.log(`✔ KaTeX Validation Passed: 0 KaTeX errors across ${allMathMatches.length} formatted math expressions.`);

console.log('\n==================================================');
console.log('ALL EXTRACTION ENGINE & FORMATTER TESTS PASSED SUCCESSFULLY!');
console.log('==================================================');
