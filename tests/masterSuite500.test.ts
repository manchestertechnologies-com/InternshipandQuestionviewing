import { describe, it } from 'node:test';
import assert from 'node:assert';
import { textToLaTeX, isMathExpression, autoFormatMixedTextToLaTeX } from '../src/lib/mathParser';
import { formatCleanText, parseRichTextToUnicode, autoFormatIonicChargesAndChemistry, autoFormatScientificExponents, autoFormatStackedFractions } from '../src/lib/pasteUtils';
import katex from 'katex';

describe('MASTER 5000+ COMPREHENSIVE ULTRA TEST SUITE FOR MATHEMATICAL & CHEMICAL ENGINE', () => {

  // SECTION 1: 1,000+ CHEMICAL FORMULAS & IONIC CHARGES
  describe('Section 1: Chemical Formulas & Ionic Charges (1,000 Cases)', () => {
    const chemicalBases = ['H2O', 'H2SO4', 'CO2', 'CCl4', 'NaCl', 'Mg(OH)2', 'NH4+', 'SO42-', 'PO43-', 'Cr2O72-', 'Fe3+', 'Cu2+', 'Ca2+', 'Al3+', 'S2-', 'Cl-', 'K+', 'Na+', 'P2Q3', 'CH4', 'C2H5OH', 'C6H12O6', 'KMnO4', 'HNO3', 'HCl', 'NaOH', 'CaCO3', 'Fe2O3', 'Al2O3', 'BaSO4', 'ZnSO4', 'Pb(NO3)2', 'AgNO3', 'CuSO4', 'K2CrO4', 'NH3', 'N2', 'O2', 'O3', 'H2', 'F2', 'Br2', 'I2', 'P4', 'S8', 'NO2', 'N2O4', 'N2O5', 'SO3', 'H2O2', 'MnO4-', 'HCO3-', 'CN-', 'OH-', 'NO3-', 'CO32-', 'S2O32-', 'ClO4-', 'BrO3-', 'IO3-'];

    for (let i = 1; i <= 1000; i++) {
      const base = chemicalBases[(i - 1) % chemicalBases.length];
      const input = i <= chemicalBases.length ? base : `${base} in solution ${i}`;

      it(`Chem Case ${i}: ${input}`, () => {
        const formatted = formatCleanText(input);
        assert.strictEqual(typeof formatted, 'string');
        const latex = textToLaTeX(formatted);
        const html = katex.renderToString(latex, { throwOnError: false });
        assert.strictEqual(html.includes('katex-error'), false, `KaTeX error for ${input}`);
      });
    }
  });

  // SECTION 2: 1,000+ MATHEMATICAL FRACTIONS & EQUATIONS
  describe('Section 2: Mathematical Fractions & Equations (1,000 Cases)', () => {
    const fractionTemplates = [
      '(x^2+3x+2)/(x-1)', '(2x+5)/3', '(-b±sqrt(b^2-4ac))/(2a)', '1/2', '3/4',
      '5/6', '7/8', '(a+b)/(c+d)', 'dx/dt', 'dy/dx', 'sin(x)/cos(x)', 'tan(x)/1',
      '1/(1+x^2)', '(x+1)/(x-1)', '(x^2-1)/(x+1)', 'a/b', 'c/d', 'E/mc^2', 'PV/nRT',
      'F/A', 'W/t', 'm/v', 'q/t', 'V/R', 'P/I', '1/(2pi)', 'pi/2', '2pi/3',
      '3pi/4', 'sqrt(PE/I)', '1/(2pi)sqrt(PE/I)', 'pi*sqrt(I/PE)', 'sqrt(PE/I)',
      '2pi*sqrt(I/PE)', '1/(4pi*epsilon_0)', '(q1*q2)/r^2', 'G*(m1*m2)/r^2',
      'h/lambda', 'hc/lambda', '1/lambda', 'R*(1/n1^2 - 1/n2^2)', '(v-u)/t',
      '(s2-s1)/(t2-t1)', '(y2-y1)/(x2-x1)', 'a/(1-r)', 'n!/(r!(n-r)!)', '1/x'
    ];

    for (let i = 1; i <= 1000; i++) {
      const template = fractionTemplates[(i - 1) % fractionTemplates.length];
      const input = `Eq ${i}: ${template}`;

      it(`Fraction/Eq Case ${i}: ${input}`, () => {
        const latex = textToLaTeX(input);
        assert.strictEqual(typeof latex, 'string');
        const html = katex.renderToString(latex, { throwOnError: false });
        assert.strictEqual(html.includes('katex-error'), false, `KaTeX error for ${input}`);
      });
    }
  });

  // SECTION 3: 1,000+ SCIENTIFIC EXPONENTS & UNITS
  describe('Section 3: Scientific Exponents & Units (1,000 Cases)', () => {
    const units = ['nm', 'pm', 'mm', 'cm', 'm', 'km', 'μm', 'Å', 'g', 'kg', 'mg', 'mol', 'Hz', 'Pa', 'J', 'V', 'A', 'W', 'N', 'Ω', '°C', 'K'];

    for (let i = 1; i <= 1000; i++) {
      const exp = (i % 20) - 10;
      const unit = units[i % units.length];
      const input = `10^${exp} ${unit}`;

      it(`Exponent Case ${i}: ${input}`, () => {
        const formatted = autoFormatScientificExponents(input);
        assert.strictEqual(typeof formatted, 'string');
        const latex = textToLaTeX(formatted);
        const html = katex.renderToString(latex, { throwOnError: false });
        assert.strictEqual(html.includes('katex-error'), false, `KaTeX error for ${input}`);
      });
    }
  });

  // SECTION 4: 1,000+ MS WORD & PROTECTED VIEW HTML PASTES
  describe('Section 4: MS Word & Protected View HTML Pastes (1,000 Cases)', () => {
    for (let i = 1; i <= 1000; i++) {
      it(`Word HTML Case ${i}: OMML Math & Protected View tags`, () => {
        const wordHtml = `
<html xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:m="http://schemas.microsoft.com/office/2004/12/omml">
<body>
<p class=MsoNormal>Question ${i}. The electronic configuration is given by:</p>
<!--[if gte mso 9]><xml>
 <m:oMathPara><m:oMath><m:r><m:t>P(1s²2s²2p^{i % 6 + 1}); Q(1s²2s²2p⁵)</m:t></m:r></m:oMath></m:oMathPara>
</xml><![endif]-->
<p class=MsoNormal>(a) P_${i}</p>
<p class=MsoNormal>(b) Q_${i}</p>
</body></html>`;
        const parsed = parseRichTextToUnicode(wordHtml);
        assert.strictEqual(parsed.includes(`Question ${i}`), true);
        assert.strictEqual(parsed.includes(`P(1s²2s²2p`), true);
        assert.strictEqual(parsed.includes(`(a) P`), true);
      });
    }
  });

  // SECTION 5: 1,000+ MIXED ENGLISH PROSE & TEXT SLASH CASES
  describe('Section 5: Mixed English Prose & Text Slashes (1,000 Cases)', () => {
    const slashPairs = [
      'difference/path', 'input/output', 'pass/fail', 'true/false', 'yes/no',
      'increase/decrease', 'positive/negative', 'acid/base', 'day/night',
      'correct/incorrect', 'even/odd', 'real/imaginary', 'open/closed',
      'before/after', 'start/stop', 'win/loss', 'read/write', 'import/export'
    ];

    for (let i = 1; i <= 1000; i++) {
      const pair = slashPairs[(i - 1) % slashPairs.length];
      const prose = `Item ${i}: Phase difference = (2*pi/lambda) x path difference, so ratio (${pair}) = 2*pi/lambda. Option (B).`;

      it(`Mixed Prose Case ${i}: ${pair}`, () => {
        const latex = textToLaTeX(prose);
        assert.strictEqual(latex.includes(`\\frac{${pair.split('/')[0]}}{${pair.split('/')[1]}}`), false, `Slash pair ${pair} must stay text slash`);
        const html = katex.renderToString(latex, { throwOnError: false });
        assert.strictEqual(html.includes('katex-error'), false);
      });
    }
  });

});
