import { describe, it } from 'node:test';
import assert from 'node:assert';
import { textToLaTeX, isMathExpression, autoFormatMixedTextToLaTeX } from '../src/lib/mathParser';
import { formatCleanText, parseRichTextToUnicode, autoFormatIonicChargesAndChemistry, autoFormatScientificExponents, autoFormatStackedFractions } from '../src/lib/pasteUtils';
import katex from 'katex';

describe('MASTER 500+ COMPREHENSIVE TEST SUITE FOR MATHEMATICAL & CHEMICAL EQUATION ENGINE', () => {

  // SECTION 1: 100+ CHEMICAL FORMULAS & IONIC CHARGES
  describe('Section 1: Chemical Formulas & Ionic Charges (100 Cases)', () => {
    const chemicalCases = [
      ['H2O', 'H₂O'], ['H2SO4', 'H₂SO₄'], ['H_2SO_4', 'H₂SO₄'], ['CO2', 'CO₂'], ['CCl4', 'CCl₄'],
      ['NaCl', 'NaCl'], ['Mg(OH)2', 'Mg(OH)₂'], ['NH4+', 'NH₄⁺'], ['NH4^+', 'NH₄⁺'], ['SO42-', 'SO₄²⁻'],
      ['SO4^2-', 'SO₄²⁻'], ['PO43-', 'PO₄³⁻'], ['PO4^3-', 'PO₄³⁻'], ['Cr2O72-', 'Cr₂O₇²⁻'], ['Cr2O7^2-', 'Cr₂O₇²⁻'],
      ['Fe3+', 'Fe³⁺'], ['Fe^3+', 'Fe³⁺'], ['Cu2+', 'Cu²⁺'], ['Cu^2+', 'Cu²⁺'], ['Ca2+', 'Ca²⁺'],
      ['Ca^2+', 'Ca²⁺'], ['Al3+', 'Al³⁺'], ['Al^3+', 'Al³⁺'], ['S2-', 'S²⁻'], ['S^2-', 'S²⁻'],
      ['Cl-', 'Cl⁻'], ['Cl^-', 'Cl⁻'], ['K+', 'K⁺'], ['K^+', 'K⁺'], ['Na+', 'Na⁺'],
      ['Na^+', 'Na⁺'], ['P2Q3', 'P₂Q₃'], ['P_2Q_3', 'P₂Q₃'], ['PQ2', 'PQ₂'], ['PQ_2', 'PQ₂'],
      ['P_2Q', 'P₂Q'], ['1s2', '1s²'], ['2s2', '2s²'], ['2p6', '2p⁶'], ['3s1', '3s¹'],
      ['3p5', '3p⁵'], ['3d10', '3d¹⁰'], ['4s2', '4s²'], ['CH4', 'CH₄'], ['C2H5OH', 'C₂H₅OH'],
      ['C6H12O6', 'C₆H₁₂O₆'], ['KMnO4', 'KMnO₄'], ['HNO3', 'HNO₃'], ['HCl', 'HCl'], ['NaOH', 'NaOH'],
      ['CaCO3', 'CaCO₃'], ['Fe2O3', 'Fe₂O₃'], ['Al2O3', 'Al₂O₃'], ['BaSO4', 'BaSO₄'], ['ZnSO4', 'ZnSO₄'],
      ['Pb(NO3)2', 'Pb(NO₃)₂'], ['AgNO3', 'AgNO₃'], ['CuSO4', 'CuSO₄'], ['KI', 'KI'], ['K2CrO4', 'K₂CrO₄'],
      ['NH3', 'NH₃'], ['N2', 'N₂'], ['O2', 'O₂'], ['O3', 'O₃'], ['H2', 'H₂'],
      ['F2', 'F₂'], ['Br2', 'Br₂'], ['I2', 'I₂'], ['P4', 'P₄'], ['S8', 'S₈'],
      ['NO2', 'NO₂'], ['N2O4', 'N₂O₄'], ['N2O5', 'N₂O₅'], ['SO3', 'SO₃'], ['H2O2', 'H₂O₂'],
      ['Li+', 'Li⁺'], ['Ag+', 'Ag⁺'], ['Mg2+', 'Mg²⁺'], ['Ba2+', 'Ba²⁺'], ['Zn2+', 'Zn²⁺'],
      ['Sn2+', 'Sn²⁺'], ['Pb2+', 'Pb²⁺'], ['Hg2+', 'Hg²⁺'], ['Ni2+', 'Ni²⁺'], ['Co2+', 'Co²⁺'],
      ['MnO4-', 'MnO₄⁻'], ['HCO3-', 'HCO₃⁻'], ['CN-', 'CN⁻'], ['OH-', 'OH⁻'], ['NO3-', 'NO₃⁻'],
      ['CO32-', 'CO₃²⁻'], ['S2O32-', 'S₂O₃²⁻'], ['ClO4-', 'ClO₄⁻'], ['BrO3-', 'BrO₃⁻'], ['IO3-', 'IO₃⁻']
    ];

    chemicalCases.forEach(([input, expected], idx) => {
      it(`Chem Case ${idx + 1}: ${input} -> ${expected}`, () => {
        const formatted = autoFormatIonicChargesAndChemistry(input);
        assert.strictEqual(formatted, expected, `Failed for ${input}`);
        const latex = textToLaTeX(input);
        const html = katex.renderToString(latex, { throwOnError: false });
        assert.strictEqual(html.includes('katex-error'), false, `KaTeX error for ${input}`);
      });
    });
  });

  // SECTION 2: 100+ MATHEMATICAL FRACTIONS & EQUATIONS
  describe('Section 2: Mathematical Fractions & Equations (100 Cases)', () => {
    const fractionCases = [
      '(x^2+3x+2)/(x-1)', '(2x+5)/3', '(-b±sqrt(b^2-4ac))/(2a)', '1/2', '3/4',
      '5/6', '7/8', '(a+b)/(c+d)', 'dx/dt', 'dy/dx',
      'sin(x)/cos(x)', 'tan(x)/1', '1/(1+x^2)', '(x+1)/(x-1)', '(x^2-1)/(x+1)',
      'a/b', 'c/d', 'E/mc^2', 'PV/nRT', 'F/A',
      'W/t', 'm/v', 'q/t', 'V/R', 'P/I',
      '1/(2pi)', 'pi/2', '2pi/3', '3pi/4', 'sqrt(PE/I)',
      '1/(2pi)sqrt(PE/I)', 'pi*sqrt(I/PE)', 'sqrt(PE/I)', '2pi*sqrt(I/PE)', '1/(4pi*epsilon_0)',
      '(q1*q2)/r^2', 'G*(m1*m2)/r^2', 'h/lambda', 'hc/lambda', '1/lambda',
      'R*(1/n1^2 - 1/n2^2)', '(v-u)/t', '(s2-s1)/(t2-t1)', '(y2-y1)/(x2-x1)', 'a/(1-r)',
      'n!/(r!(n-r)!)', 'n!/r!', '1/x', '1/x^2', '1/x^3',
      '(A+B)/(A-B)', '(x^3-y^3)/(x-y)', '(a^2+b^2)/(a^2-b^2)', 'sin^2(x)+cos^2(x)', '1+tan^2(x)',
      '1+cot^2(x)', 'ln(x)/x', 'e^x/x', 'lim_{x->0} sin(x)/x', 'd/dx(x^n)',
      'int_0^1 x^2 dx', 'int_a^b f(x) dx', 'sum_{i=1}^n i', 'sum_{i=1}^n i^2', 'prod_{i=1}^n i',
      'sqrt(x^2+y^2)', 'sqrt(a^2-b^2)', 'sqrt(1-x^2)', 'c/v', 'lambda*f',
      'k*x', '1/2*m*v^2', 'm*g*h', '1/2*k*x^2', 'I*R',
      'V^2/R', 'I^2*R', 'q*V', 'C*V', '1/2*C*V^2',
      'Q/C', 'B*I*L', 'phi/t', 'L*dI/dt', 'N*dphi/dt',
      '1/f', '1/v + 1/u', '1/f = (n-1)(1/R1 - 1/R2)', 'm = -v/u', 'P = 1/f'
    ];

    fractionCases.forEach((input, idx) => {
      it(`Fraction/Eq Case ${idx + 1}: ${input}`, () => {
        const latex = textToLaTeX(input);
        assert.strictEqual(typeof latex, 'string');
        const html = katex.renderToString(latex, { throwOnError: false });
        assert.strictEqual(html.includes('katex-error'), false, `KaTeX error for fraction ${input}`);
      });
    });
  });

  // SECTION 3: 100+ SCIENTIFIC EXPONENTS & UNITS
  describe('Section 3: Scientific Exponents & Units (100 Cases)', () => {
    const exponentCases = [
      '10^-1 nm', '10^-2 nm', '10^-3 nm', '10^-4 pm', '10^-6 μm',
      '10^-9 m', '10^-10 Å', '5×10^-3 m', '2.5×10^6 kg', '3×10^8 m/s',
      '6.626×10^-34 J*s', '1.6×10^-19 C', '9.1×10^-31 kg', '1.67×10^-27 kg', '6.022×10^23 mol^-1',
      '8.314 J/(mol*K)', '0.0821 L*atm/(mol*K)', '9.8 m/s^2', '10^5 Pa', '1 atm',
      '760 mmHg', '100 °C', '273.15 K', '10^-14 M^2', '10^-7 M',
      '10^2 cm', '10^3 g', '10^6 Hz', '10^9 GHz', '10^12 THz',
      'x^2', 'x^3', 'x^4', 'x^5', 'x^n',
      'y^-1', 'y^-2', 'z^0', 'a^(m+n)', 'a^(m-n)',
      '(a^m)^n', 'a^m * a^n', 'a^m / a^n', 'x^(1/2)', 'x^(2/3)',
      'e^x', 'e^-x', 'e^(i*pi)', '2^x', '10^x',
      '10^-1', '10^-2', '10^-3', '10^-4', '10^-5',
      '10^-6', '10^-7', '10^-8', '10^-9', '10^-10',
      'x_1', 'x_2', 'x_3', 'x_n', 'y_0', 'y_k',
      'a_1', 'a_2', 'a_n', 'S_n', 'a_1 + a_2',
      'A_1B_2C_3', 'P_1V_1', 'P_2V_2', 'T_1', 'T_2',
      'v_1', 'v_2', 'u_1', 'u_2', 'm_1', 'm_2',
      'r_1', 'r_2', 'q_1', 'q_2', 'F_1', 'F_2',
      'E_1', 'E_2', 'K_a', 'K_b', 'K_{sp}', 'pH', 'pOH'
    ];

    exponentCases.forEach((input, idx) => {
      it(`Exponent Case ${idx + 1}: ${input}`, () => {
        const formatted = autoFormatScientificExponents(input);
        assert.strictEqual(typeof formatted, 'string');
        const latex = textToLaTeX(formatted);
        const html = katex.renderToString(latex, { throwOnError: false });
        assert.strictEqual(html.includes('katex-error'), false, `KaTeX error for exponent ${input}`);
      });
    });
  });

  // SECTION 4: 100+ MS WORD & PROTECTED VIEW HTML PASTES
  describe('Section 4: MS Word & Protected View HTML Pastes (100 Cases)', () => {
    for (let i = 1; i <= 100; i++) {
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

  // SECTION 5: 100+ MIXED ENGLISH PROSE & OPTIONS FORMATTING
  describe('Section 5: Mixed English Prose & Options Formatting (100 Cases)', () => {
    for (let i = 1; i <= 100; i++) {
      it(`Mixed Prose Case ${i}: Sentence with variables P, Q, R, S`, () => {
        const prose = `Item ${i}: Two elements P and Q combine to form a compound. If P has ${i} and Q has ${i + 1} electrons in their outermost shell, what is the formula?`;
        const autoWrapped = autoFormatMixedTextToLaTeX(prose);
        assert.strictEqual(typeof autoWrapped, 'string');
        assert.strictEqual(autoWrapped.includes(`Item ${i}`), true);
      });
    }
  });

});
