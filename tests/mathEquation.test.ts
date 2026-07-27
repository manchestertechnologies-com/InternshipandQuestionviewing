import { describe, it } from 'node:test';
import assert from 'node:assert';
import { textToLaTeX, isMathExpression } from '../src/lib/mathParser';
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
});
