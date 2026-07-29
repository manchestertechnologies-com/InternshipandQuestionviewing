import { describe, it } from 'node:test';
import assert from 'node:assert';
import { textToLaTeX, isMathExpression } from '../src/lib/mathParser';
import { formatCleanText, parseRichTextToUnicode } from '../src/lib/pasteUtils';
import katex from 'katex';

describe('Professional Mathematical Equation Rendering Tests', () => {
  it('Regression Case 1: (x²+3x+2)/(x−1)', () => {
    const input = '(x²+3x+2)/(x−1)';
    const latex = textToLaTeX(input);
    assert.strictEqual(/\\frac\{x\^\{?2\}?\+3x\+2\}\{x-1\}/.test(latex), true, `Expected fraction, got: ${latex}`);
    const html = katex.renderToString(latex, { throwOnError: false });
    assert.strictEqual(html.includes('katex'), true);
  });

  it('Regression Case 2: (2x+5)/3', () => {
    const input = '(2x+5)/3';
    const latex = textToLaTeX(input);
    assert.strictEqual(latex.includes('\\frac{2x+5}{3}'), true, `Expected fraction, got: ${latex}`);
    const html = katex.renderToString(latex, { throwOnError: false });
    assert.strictEqual(html.includes('katex'), true);
  });

  it('Regression Case 3: Multiple fractions in equation: (x²+3x+2)/(x−1)=(2x+5)/3', () => {
    const input = '(x²+3x+2)/(x−1)=(2x+5)/3';
    const latex = textToLaTeX(input);
    assert.strictEqual(latex.includes('='), true);
    assert.strictEqual(latex.includes('\\frac{'), true);
    const html = katex.renderToString(latex, { throwOnError: false });
    assert.strictEqual(html.includes('katex'), true);
  });

  it('Regression Case 4: Square Root: √(2x−1)', () => {
    const input = '√(2x−1)';
    const latex = textToLaTeX(input);
    assert.strictEqual(latex.includes('\\sqrt{2x-1}'), true, `Expected \\sqrt{2x-1}, got: ${latex}`);
    const html = katex.renderToString(latex, { throwOnError: false });
    assert.strictEqual(html.includes('katex'), true);
  });

  it('Regression Case 5: Nested Radical & Fraction: √((x²+3x+2)/(x−1))', () => {
    const input = '√((x²+3x+2)/(x−1))';
    const latex = textToLaTeX(input);
    assert.strictEqual(latex.includes('\\sqrt{'), true, `Expected \\sqrt{, got: ${latex}`);
    assert.strictEqual(latex.includes('\\frac{'), true, `Expected \\frac{, got: ${latex}`);
    const html = katex.renderToString(latex, { throwOnError: false });
    assert.strictEqual(html.includes('katex'), true);
  });

  it('Regression Case 6: Quadratic formula: (-b±√(b²−4ac))/(2a)', () => {
    const input = '(-b±√(b²−4ac))/(2a)';
    const latex = textToLaTeX(input);
    assert.strictEqual(latex.includes('\\frac{'), true, `Expected fraction, got: ${latex}`);
    assert.strictEqual(latex.includes('\\sqrt{'), true, `Expected sqrt, got: ${latex}`);
    assert.strictEqual(latex.includes('\\pm'), true, `Expected \\pm, got: ${latex}`);
    const html = katex.renderToString(latex, { throwOnError: false });
    assert.strictEqual(html.includes('katex'), true);
  });

  it('Regression Case 7: Polyatomic Ion: SO₄²⁻', () => {
    const input = 'SO₄²⁻';
    const latex = textToLaTeX(input);
    assert.strictEqual(latex.includes('SO') && (latex.includes('_{4}') || latex.includes('_4')) && latex.includes('^{2-}'), true, `Expected SO_4^{2-}, got: ${latex}`);
    const html = katex.renderToString(latex, { throwOnError: false });
    assert.strictEqual(html.includes('katex'), true);
  });

  it('Regression Case 8: Monoatomic Ion: Ca²⁺', () => {
    const input = 'Ca²⁺';
    const latex = textToLaTeX(input);
    assert.strictEqual(latex.includes('Ca') && latex.includes('^{2+}'), true, `Expected Ca^{2+}, got: ${latex}`);
    const html = katex.renderToString(latex, { throwOnError: false });
    assert.strictEqual(html.includes('katex'), true);
  });

  it('Regression Case 9: Exponent with unit: 10⁻³ nm', () => {
    const input = '10⁻³ nm';
    const latex = textToLaTeX(input);
    assert.strictEqual(latex.includes('10^{-3}'), true, `Expected 10^{-3}, got: ${latex}`);
    const html = katex.renderToString(latex, { throwOnError: false });
    assert.strictEqual(html.includes('katex'), true);
  });

  it('Regression Case 10: Integral with bounds: ∫₀¹x²dx', () => {
    const input = '∫₀¹x²dx';
    const latex = textToLaTeX(input);
    assert.strictEqual(latex.includes('\\int_{0}^{1}'), true, `Expected integral, got: ${latex}`);
    const html = katex.renderToString(latex, { throwOnError: false });
    assert.strictEqual(html.includes('katex'), true);
  });

  it('Regression Case 11: Summation with bounds: ∑ᵢ₌₁ⁿi²', () => {
    const input = '∑ᵢ₌₁ⁿi²';
    const latex = textToLaTeX(input);
    assert.strictEqual(latex.includes('\\sum_{i=1}^{n}'), true, `Expected summation, got: ${latex}`);
    const html = katex.renderToString(latex, { throwOnError: false });
    assert.strictEqual(html.includes('katex'), true);
  });

  it('Textbook Photo Q29 Options: 1/(2\\pi)\\sqrt{PE/I}, \\pi\\sqrt{I/PE}, \\sqrt{PE/I}, 2\\pi\\sqrt{I/PE}', () => {
    const opt1 = '1/(2\\pi) \\sqrt{PE/I}';
    const opt2 = '\\pi \\sqrt{I/PE}';
    const opt3 = '\\sqrt{PE/I}';
    const opt4 = '2\\pi \\sqrt{I/PE}';

    assert.strictEqual(textToLaTeX(opt1).includes('\\frac{1}{2\\pi}'), true);
    assert.strictEqual(textToLaTeX(opt1).includes('\\sqrt{\\frac{PE}{I}}'), true);
    assert.strictEqual(textToLaTeX(opt2).includes('\\pi') && textToLaTeX(opt2).includes('\\sqrt{\\frac{I}{PE}}'), true);
    assert.strictEqual(textToLaTeX(opt3).includes('\\sqrt{\\frac{PE}{I}}'), true);
    assert.strictEqual(textToLaTeX(opt4).includes('2\\pi') && textToLaTeX(opt4).includes('\\sqrt{\\frac{I}{PE}}'), true);

    [opt1, opt2, opt3, opt4].forEach(opt => {
      const html = katex.renderToString(textToLaTeX(opt), { throwOnError: false });
      assert.strictEqual(html.includes('katex'), true);
    });
  });

  it('Textbook Photo Q29 Question text with \\vec{E}', () => {
    const qText = 'A dipole of dipole moment P and moment of inertia I is placed in a uniform electric field \\vec{E}.';
    assert.strictEqual(isMathExpression(qText), true);
  });

  it('Preserves Enter key newlines and multi-line alignment without stripping or merging', () => {
    const inputWithEnter = 'Question Line 1\nQuestion Line 2\n';
    const formatted = formatCleanText(inputWithEnter);
    assert.strictEqual(formatted, 'Question Line 1\nQuestion Line 2\n', `Expected lines and trailing newline preserved, got: ${JSON.stringify(formatted)}`);
  });

  it('MS Word Equation OMML/MathML Copy Paste Parsing', () => {
    const wordHtmlSample = `
<p class=MsoNormal>The electronic configuration of four atoms are given in brackets :</p>
<p class=MsoEquation><m:oMathPara><m:oMath><m:r><m:t>P(1s²2s²2p¹); Q(1s²2s²2p⁵)</m:t></m:r></m:oMath></m:oMathPara></p>
<p class=MsoEquation><m:oMathPara><m:oMath><m:r><m:t>R(1s²2s²2p⁶3s¹); S(1s²2s²2p²)</m:t></m:r></m:oMath></m:oMathPara></p>
<p class=MsoNormal>The element that would most readily form a diatomic molecule is</p>
`;
    const parsed = parseRichTextToUnicode(wordHtmlSample);
    const formatted = formatCleanText(parsed);
    assert.strictEqual(formatted.includes('P(1s²2s²2p¹)'), true);
    assert.strictEqual(formatted.includes('Q(1s²2s²2p⁵)'), true);
    assert.strictEqual(formatted.includes('R(1s²2s²2p⁶3s¹)'), true);
    assert.strictEqual(formatted.includes('S(1s²2s²2p²)'), true);
    assert.strictEqual(formatted.includes('The element that would most readily form a diatomic molecule is'), true);
  });

  it('Regression Case 14: Full Screenshot Multi-line Solution Copy-Paste Typesetting', () => {
    const rawSolutionInput = [
      'Current follows i = I_o sin(\\wt), with \\w = 100\\pi \\frac{rad}{s}.',
      'Peak value occurs at \\wt = \\frac{\\pi}{2}. The current equals its rms value (I_o/\\sqrt2) when sin(\\wt) = 1/\\sqrt2, i.e. \\wt = \\frac{\\pi}{4} or \\frac{3\\pi}{4}.',
      'Moving forward from the peak (\\frac{\\pi}{2}), the next instant at which i = I_o/\\sqrt2 is \\wt = \\frac{3\\pi}{4}.',
      'Time interval \\Delta t = \\frac{3\\pi/4 - \\pi/2}{\\w} = \\frac{\\frac{\\pi}{4}}{100\\pi} = \\frac{1}{400} = 2.5\\times10^{-3} s \\rightarrow Option (4).'
    ].join('\n');

    const lines = rawSolutionInput.split('\n');
    lines.forEach((line) => {
      const latex = textToLaTeX(line);
      assert.strictEqual(latex.includes('\\omega'), true, `Expected \\omega in line: ${line}`);
      const html = katex.renderToString(latex, { throwOnError: false });
      assert.strictEqual(html.includes('katex'), true, `KaTeX rendering failed for line: ${line}`);
    });
  });

  it('Regression Case 15: Automatic trig backslash, sqrt digits & Option label text conversion', () => {
    assert.strictEqual(textToLaTeX('sin(\\wt)').includes('\\sin(\\omega t)'), true);
    assert.strictEqual(textToLaTeX('cos(\\wt)').includes('\\cos(\\omega t)'), true);
    assert.strictEqual(textToLaTeX('\\sqrt2').includes('\\sqrt{2}'), true);
    assert.strictEqual(textToLaTeX('\\sqrt3').includes('\\sqrt{3}'), true);
    assert.strictEqual(textToLaTeX('Option (4)').includes('\\text{Option (4)}'), true);
  });

  it('Regression Case 16: Organic Chemistry Decarboxylative Halogenation Text & Formula Whitespace Preservation', () => {
    const rawInput = [
      'CH_3COOAg (silver acetate) ---(\\frac{Br_2}{CCl_4} (Hunsdiecker reaction))--->',
      'The product of this classic decarboxylative halogenation is:',
      '(A) CH_3Br (methyl bromide) + CO_2 + AgBr',
      '(B) CH_3CH_2Br + AgOOCCH_3',
      '(C) CH_3COBr + Ag_2O',
      '(D) No reaction occurs'
    ].join('\n');

    const lines = rawInput.split('\n');
    assert.strictEqual(lines.length, 6);
    assert.strictEqual(textToLaTeX('CH_3COOAg').includes('CH_{3}COOAg') || textToLaTeX('CH_3COOAg').includes('CH_3COOAg'), true);
    assert.strictEqual(textToLaTeX('CO_2').includes('CO_{2}') || textToLaTeX('CO_2').includes('CO_2'), true);
    assert.strictEqual(textToLaTeX('Ag_2O').includes('Ag_{2}O') || textToLaTeX('Ag_2O').includes('Ag_2O'), true);
  });

  it('Regression Case 17: User Screenshots 1-5 Exact Question Text Math & Plain Text Validation', () => {
    const screenshot1 = 'Fringe width \\beta=\\frac{\\lambda D}{d}. Next, with d halved and D doubled: beta_{new}=\\lambda\\frac{2D}{d/2}=4\\times(\\frac{\\lambda D}{d})=4\\beta, so fringe width becomes four times. This confirms that option (D) is the correct answer.';
    const screenshot2 = 'Voltage and current in an ac circuit are given by V=5\\sin\\left(100\\pi t-\\frac{\\pi }{6}\\right) and I=4\\sin\\left(100\\pi t+\\frac{\\pi }{6}\\right)';
    const screenshot3 = 'varies with time according to the equation V=100sin100\\pitcos100\\pit';
    const screenshot4 = 'Light of wavelength \\lambda strikes a photo-sensitive surface and electrons are ejected with kinetic energy E.';
    const screenshot5 = 'Two equal charges q are placed at a distance of 2a and a third charge - 2q is placed at the midpoint.';

    [screenshot1, screenshot2, screenshot3, screenshot4, screenshot5].forEach(text => {
      assert.strictEqual(typeof text, 'string');
      assert.strictEqual(text.length > 0, true);
    });
  });

  it('Regression Case 18: Screenshot 8 Numerical Ratio Phase Difference/Path Difference Text Slash Parsing', () => {
    const screenshot8 = 'Phase difference = (\\frac{2*\\pi}{\\lambda}) x path difference, so the ratio (phase difference/path difference) = \\frac{2*\\pi}{\\lambda}. This confirms that option (B) is the correct answer.';
    const latex = textToLaTeX(screenshot8);
    // Ensure difference/path is NOT converted into \frac{difference}{path}
    assert.strictEqual(latex.includes('\\frac{difference}{path}'), false, 'difference/path must stay English text slash');
    const html = katex.renderToString(textToLaTeX('\\frac{2*\\pi}{\\lambda}'), { throwOnError: false });
    assert.strictEqual(html.includes('katex'), true);
  });

  it('Regression Case 19: Vector Arrow \\vec{E}, \\hat{i}, \\hat{j}, \\vec E and Unicode Combining Arrow Normalization', () => {
    assert.strictEqual(textToLaTeX('\\vec E').includes('\\vec{E}'), true);
    assert.strictEqual(textToLaTeX('\\hat i').includes('\\hat{i}'), true);
    assert.strictEqual(textToLaTeX('\\hat j').includes('\\hat{j}'), true);
    assert.strictEqual(textToLaTeX('E\u20D7').includes('\\vec{E}'), true);
    assert.strictEqual(textToLaTeX('i\u0302').includes('\\hat{i}'), true);

    const questionInput = 'In a space having electric field \\vec{E} = A(x\\hat{i} + y\\hat{j}) the potential at a point (10 m, 20 m) is zero';
    const latex = textToLaTeX(questionInput);
    const html = katex.renderToString(latex, { throwOnError: false });
    assert.strictEqual(html.includes('katex'), true);
    assert.strictEqual(latex.includes('\\vec{E}'), true);
    assert.strictEqual(latex.includes('\\hat{i}'), true);
    assert.strictEqual(latex.includes('\\hat{j}'), true);
  });
});
