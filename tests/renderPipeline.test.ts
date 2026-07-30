/**
 * Render Pipeline Test Suite
 * ==========================
 * Validates the modular rendering pipeline:
 * - Chemistry: Unicode-only output (no LaTeX)
 * - Math: KaTeX-ready $...$ output
 * - Physics: Greek symbols in math context
 * - Biology: structure-preserving output
 * - Normalizer: Word HTML cleaning
 * - Render Engine: subject dispatch
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { parseChemistry, hasRawLatex, isChemistrySegment } from '../src/lib/render/chemistry/chemistryParser';
import { parseBiology, isBiologyContent } from '../src/lib/render/biology/biologyParser';
import { parsePhysics } from '../src/lib/render/physics/physicsParser';
import { normalizeContent } from '../src/lib/render/normalizer';
import { renderForSubject, autoRender } from '../src/lib/render/renderEngine';

// =====================================================================
// SECTION 1: Chemistry Parser — Unicode-Only Rendering
// =====================================================================

describe('Chemistry Parser — Unicode-Only Output', () => {
  it('H2O → H₂O', () => {
    const result = parseChemistry('H2O');
    assert.ok(result.includes('H₂O'), `Expected H₂O but got: ${result}`);
    assert.ok(!hasRawLatex(result), 'Should not contain raw LaTeX');
  });

  it('CO2 → CO₂', () => {
    const result = parseChemistry('CO2');
    assert.ok(result.includes('CO₂'), `Expected CO₂ but got: ${result}`);
    assert.ok(!hasRawLatex(result), 'Should not contain raw LaTeX');
  });

  it('NH4+ → NH₄⁺', () => {
    const result = parseChemistry('NH4+');
    assert.ok(result.includes('NH₄⁺'), `Expected NH₄⁺ but got: ${result}`);
    assert.ok(!hasRawLatex(result), 'Should not contain raw LaTeX');
  });

  it('SO4^2- → SO₄²⁻ (no LaTeX)', () => {
    const result = parseChemistry('SO4^2-');
    assert.ok(result.includes('SO₄²⁻'), `Expected SO₄²⁻ but got: ${result}`);
    assert.ok(!hasRawLatex(result), 'Must NOT contain \\text{}, ^{}, _{}');
  });

  it('Fe3+ → Fe³⁺', () => {
    const result = parseChemistry('Fe3+');
    assert.ok(result.includes('Fe³⁺'), `Expected Fe³⁺ but got: ${result}`);
    assert.ok(!hasRawLatex(result), 'Should not contain raw LaTeX');
  });

  it('Ca2+ → Ca²⁺', () => {
    const result = parseChemistry('Ca2+');
    assert.ok(result.includes('Ca²⁺'), `Expected Ca²⁺ but got: ${result}`);
  });

  it('Cl- → Cl⁻', () => {
    const result = parseChemistry('Cl-');
    assert.ok(result.includes('Cl⁻'), `Expected Cl⁻ but got: ${result}`);
  });

  it('Na+ → Na⁺', () => {
    const result = parseChemistry('Na+ ions dissolve');
    assert.ok(result.includes('Na⁺'), `Expected Na⁺ but got: ${result}`);
  });

  it('TiF6^2- → TiF₆²⁻ (complex polyatomic)', () => {
    const result = parseChemistry('TiF6^2-');
    assert.ok(result.includes('TiF₆²⁻'), `Expected TiF₆²⁻ but got: ${result}`);
    assert.ok(!hasRawLatex(result), 'Must NOT contain LaTeX syntax');
  });

  it('CoF6^3- → CoF₆³⁻', () => {
    const result = parseChemistry('CoF6^3-');
    assert.ok(result.includes('CoF₆³⁻'), `Expected CoF₆³⁻ but got: ${result}`);
    assert.ok(!hasRawLatex(result), 'Must NOT contain raw LaTeX');
  });

  it('NiCl4^2- → NiCl₄²⁻', () => {
    const result = parseChemistry('NiCl4^2-');
    assert.ok(result.includes('NiCl₄²⁻'), `Expected NiCl₄²⁻ but got: ${result}`);
    assert.ok(!hasRawLatex(result), 'Must NOT contain raw LaTeX');
  });

  it('Cr2O7^2- → Cr₂O₇²⁻', () => {
    const result = parseChemistry('Cr2O7^2-');
    assert.ok(result.includes('Cr₂O₇²⁻'), `Expected Cr₂O₇²⁻ but got: ${result}`);
    assert.ok(!hasRawLatex(result), 'Must NOT contain raw LaTeX');
  });

  it('Electron config 1s^2 2p^6 → 1s² 2p⁶', () => {
    const result = parseChemistry('1s^2 2s^2 2p^6');
    assert.ok(result.includes('1s²'), `Expected 1s² but got: ${result}`);
    assert.ok(result.includes('2p⁶'), `Expected 2p⁶ but got: ${result}`);
    assert.ok(!hasRawLatex(result), 'Must NOT contain raw LaTeX');
  });

  it('Reaction arrow -> → →', () => {
    const result = parseChemistry('H2 + O2 -> H2O');
    assert.ok(result.includes('→'), `Expected → but got: ${result}`);
  });

  it('Equilibrium arrow <-> → ⇌', () => {
    const result = parseChemistry('N2 + 3H2 <-> 2NH3');
    assert.ok(result.includes('⇌'), `Expected ⇌ but got: ${result}`);
  });

  it('Chemistry detection: SO4^2- is chemistry', () => {
    assert.ok(isChemistrySegment('SO4^2-'));
    assert.ok(isChemistrySegment('H2O'));
    assert.ok(isChemistrySegment('Fe3+'));
    assert.ok(!isChemistrySegment('The quick brown fox'));
  });

  it('NO LaTeX in output: never produces \\text{}, ^{}, _{}', () => {
    const inputs = ['SO4^2-', 'NH4+', 'Fe3+', 'TiF6^2-', 'H2SO4', 'NaOH', 'Ca2+'];
    for (const input of inputs) {
      const result = parseChemistry(input);
      assert.ok(
        !hasRawLatex(result),
        `Chemistry "${input}" should not produce LaTeX. Got: ${result}`
      );
    }
  });
});

// =====================================================================
// SECTION 2: Biology Parser
// =====================================================================

describe('Biology Parser — Structure Preserving', () => {
  it('Homo sapiens → <em>Homo sapiens</em>', () => {
    const result = parseBiology('Homo sapiens is a species');
    assert.ok(result.includes('<em>Homo sapiens</em>'), `Expected italic, got: ${result}`);
  });

  it('Mangifera indica → italic', () => {
    const result = parseBiology('Mangifera indica fruit');
    assert.ok(result.includes('<em>Mangifera indica</em>'), `Expected italic, got: ${result}`);
  });

  it('F1 → F₁ (genetics generation)', () => {
    const result = parseBiology('The F1 generation showed');
    assert.ok(result.includes('F₁'), `Expected F₁, got: ${result}`);
  });

  it('F2 → F₂', () => {
    const result = parseBiology('F2 offspring were');
    assert.ok(result.includes('F₂'), `Expected F₂, got: ${result}`);
  });

  it('FADH2 → FADH₂', () => {
    const result = parseBiology('FADH2 is produced in');
    assert.ok(result.includes('FADH₂'), `Expected FADH₂, got: ${result}`);
  });

  it('H2O → H₂O in biology context', () => {
    const result = parseBiology('Water H2O is produced');
    assert.ok(result.includes('H₂O'), `Expected H₂O, got: ${result}`);
  });

  it('Biology content detection', () => {
    assert.ok(isBiologyContent('cell division during mitosis'));
    assert.ok(isBiologyContent('DNA replication in the nucleus'));
    assert.ok(!isBiologyContent('Calculate the integral of x^2'));
  });
});

// =====================================================================
// SECTION 3: Normalizer — Word HTML Cleaning
// =====================================================================

describe('Universal Normalizer', () => {
  it('Detects Word HTML', () => {
    const wordHtml = '<p class="MsoNormal" style="mso-margin-top-alt:auto">Question</p>';
    const result = normalizeContent(wordHtml);
    assert.strictEqual(result.sourceType, 'WORD_HTML');
  });

  it('Strips MsoNormal class but preserves content', () => {
    const wordHtml = '<p class="MsoNormal">Question text here</p>';
    const result = normalizeContent(wordHtml);
    assert.ok(!result.content.includes('MsoNormal'), 'MsoNormal should be stripped');
    assert.ok(result.content.includes('Question text here'), 'Content should be preserved');
  });

  it('Converts bold span to <b>', () => {
    const wordHtml = '<span style="font-weight: bold;">Important</span>';
    const result = normalizeContent(wordHtml);
    assert.ok(result.content.includes('<b>Important</b>'), `Expected <b>Important</b>, got: ${result.content}`);
  });

  it('Converts italic span to <i>', () => {
    const wordHtml = '<span style="font-style: italic;">Scientific name</span>';
    const result = normalizeContent(wordHtml);
    assert.ok(result.content.includes('<i>Scientific name</i>'), `Expected <i>, got: ${result.content}`);
  });

  it('Preserves LaTeX math blocks', () => {
    const input = 'The formula $\\frac{1}{2}mv^2$ represents kinetic energy';
    const result = normalizeContent(input);
    assert.ok(result.content.includes('$\\frac{1}{2}mv^2$'), 'Math block should be preserved');
    assert.ok(result.hasMath, 'hasMath should be true');
  });

  it('Detects Google Docs HTML', () => {
    const gdHtml = '<span id="docs-internal-guid-abc">text</span>';
    const result = normalizeContent(gdHtml);
    assert.strictEqual(result.sourceType, 'GOOGLE_DOCS_HTML');
  });

  it('Detects plain text', () => {
    const result = normalizeContent('Plain text without any HTML or LaTeX');
    assert.strictEqual(result.sourceType, 'PLAIN_TEXT');
  });

  it('Detects LaTeX source', () => {
    const result = normalizeContent('\\frac{x+1}{x-1} = \\sqrt{2}');
    assert.strictEqual(result.sourceType, 'LATEX');
  });
});

// =====================================================================
// SECTION 4: Render Engine — Subject Dispatch
// =====================================================================

describe('Render Engine — Subject Dispatch', () => {
  it('Chemistry subject routes to UNICODE type', () => {
    const result = renderForSubject('SO4^2- ion', 'Chemistry');
    assert.strictEqual(result.type, 'UNICODE', 'Chemistry must produce UNICODE type');
    assert.ok(!hasRawLatex(result.processedText), 'Chemistry output must not contain LaTeX');
  });

  it('Mathematics subject routes to KATEX type', () => {
    const result = renderForSubject('x^2 + y^2 = r^2', 'Mathematics');
    assert.strictEqual(result.type, 'KATEX', 'Math must produce KATEX type');
  });

  it('Physics subject routes to KATEX type', () => {
    const result = renderForSubject('F = ma', 'Physics');
    assert.strictEqual(result.type, 'KATEX', 'Physics must produce KATEX type');
  });

  it('Biology subject routes to HTML type', () => {
    const result = renderForSubject('Homo sapiens', 'Biology');
    assert.strictEqual(result.type, 'HTML', 'Biology must produce HTML type');
  });

  it('Botany subject routes to HTML type', () => {
    const result = renderForSubject('Mangifera indica', 'Botany');
    assert.strictEqual(result.type, 'HTML', 'Botany must produce HTML type');
  });

  it('Zoology subject routes to HTML type', () => {
    const result = renderForSubject('Panthera tigris', 'Zoology');
    assert.strictEqual(result.type, 'HTML', 'Zoology must produce HTML type');
  });

  it('Auto-detect chemistry from content', () => {
    const result = autoRender('SO4^2- and NH4+ ions');
    assert.strictEqual(result.subject, 'Chemistry');
    assert.strictEqual(result.type, 'UNICODE');
  });

  it('Auto-detect biology from binomial names', () => {
    const result = autoRender('Homo sapiens belongs to Mammalia');
    assert.strictEqual(result.subject, 'Biology');
  });

  it('Auto-detect physics from Greek symbols', () => {
    const result = autoRender('The angular velocity ω = 2πf');
    assert.strictEqual(result.subject, 'Physics');
  });
});

// =====================================================================
// SECTION 5: Cross-Subject Non-Interference
// =====================================================================

describe('Cross-Subject Non-Interference', () => {
  it('Math parser does not corrupt plain English text', () => {
    const result = renderForSubject('The quick brown fox jumps over the lazy dog', 'Mathematics');
    assert.ok(!result.processedText.includes('\\frac'), 'Should not contain \\frac in plain text');
    assert.ok(!result.processedText.includes('\\text{'), 'Should not contain \\text{ in plain text');
  });

  it('Chemistry parser does not corrupt math expressions', () => {
    // Chemistry parser should leave $...$ blocks untouched
    const text = 'The energy is $E = mc^2$ and the compound is H2O';
    const result = parseChemistry(text);
    assert.ok(!hasRawLatex(result), 'Should not produce LaTeX in chemistry output');
    assert.ok(result.includes('H₂O'), 'H2O should be converted to H₂O');
  });

  it('Biology does not touch chemistry formulas', () => {
    const result = parseBiology('ATP synthesis uses H2O');
    // Biology should convert H2O via its biochem formatter
    assert.ok(result.includes('H₂O'), `Expected H₂O, got: ${result}`);
  });
});
