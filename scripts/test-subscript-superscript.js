const {
  convertToSubscript,
  convertToSuperscript,
  parseRichTextToUnicode
} = require('../src/lib/pasteUtils');

console.log('====================================================');
console.log(' RUNNING AUTOMATED SUBSCRIPT/SUPERSCRIPT TEST SUITE ');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passCount++;
    console.log(`[PASS] Test ${passCount + failCount}: ${testName}`);
  } else {
    failCount++;
    console.error(`[FAIL] Test ${passCount + failCount}: ${testName} ${details ? '--> ' + details : ''}`);
  }
}

// ----------------------------------------------------
// TEST GROUP 1: Subscript Character Mapping
// ----------------------------------------------------
console.log('--- TEST GROUP 1: Subscript Character Mapping ---');

assert(convertToSubscript('2') === '₂', 'Subscript single digit 2');
assert(convertToSubscript('10') === '₁₀', 'Subscript multi-digit 10');
assert(convertToSubscript('+') === '₊', 'Subscript plus sign');
assert(convertToSubscript('-') === '₋', 'Subscript minus sign');
assert(convertToSubscript('n') === 'ₙ', 'Subscript letter n');

// ----------------------------------------------------
// TEST GROUP 2: Superscript Character Mapping
// ----------------------------------------------------
console.log('\n--- TEST GROUP 2: Superscript Character Mapping ---');

assert(convertToSuperscript('2') === '²', 'Superscript single digit 2');
assert(convertToSuperscript('3') === '³', 'Superscript single digit 3');
assert(convertToSuperscript('-6') === '⁻⁶', 'Superscript negative power -6');
assert(convertToSuperscript('3+') === '³⁺', 'Superscript charge 3+');
assert(convertToSuperscript('n') === 'ⁿ', 'Superscript variable n');

// ----------------------------------------------------
// TEST GROUP 3: Chemical Formulas & HTML Paste Parsing
// ----------------------------------------------------
console.log('\n--- TEST GROUP 3: Chemical Formulas Parsing ---');

assert(parseRichTextToUnicode('H<sub>2</sub>O') === 'H₂O', 'Chemical: H2O with sub tag');
assert(parseRichTextToUnicode('CO<sub>2</sub>') === 'CO₂', 'Chemical: CO2 with sub tag');
assert(parseRichTextToUnicode('H<sub>2</sub>SO<sub>4</sub>') === 'H₂SO₄', 'Chemical: H2SO4 with multiple sub tags');
assert(parseRichTextToUnicode('Fe<sup>3+</sup>') === 'Fe³⁺', 'Chemical: Fe3+ ion charge with sup tag');
assert(parseRichTextToUnicode('Ca<sup>2+</sup> + 2Cl<sup>-</sup> &rarr; CaCl<sub>2</sub>') === 'Ca²⁺ + 2Cl⁻ → CaCl₂', 'Chemical Equation with ions & arrows');

// ----------------------------------------------------
// TEST GROUP 4: Mathematical Equations Parsing
// ----------------------------------------------------
console.log('\n--- TEST GROUP 4: Mathematical Equations Parsing ---');

assert(parseRichTextToUnicode('x<sup>2</sup> + y<sup>2</sup> = z<sup>2</sup>') === 'x² + y² = z²', 'Math: Pythagorean theorem x² + y² = z²');
assert(parseRichTextToUnicode('10<sup>-6</sup> &times; 10<sup>3</sup>') === '10⁻⁶ × 10³', 'Math: Powers of 10 with times symbol');
assert(parseRichTextToUnicode('&radic;(x<sup>2</sup> + y<sup>2</sup>)') === '√(x² + y²)', 'Math: Square root with superscripts');
assert(parseRichTextToUnicode('&theta; = 45&deg;') === 'θ = 45°', 'Math: Theta and degree symbol');
assert(parseRichTextToUnicode('&alpha; + &beta; &le; 180&deg;') === 'α + β ≤ 180°', 'Math: Greek letters alpha, beta, less-equal');

// ----------------------------------------------------
// TEST GROUP 5: HTML Line Breaks & Paragraph Formatting
// ----------------------------------------------------
console.log('\n--- TEST GROUP 5: Rich Text & Linebreaks Formatting ---');

assert(parseRichTextToUnicode('<p>Statement 1: H<sub>2</sub>O is polar.</p><p>Statement 2: CO<sub>2</sub> is linear.</p>') === 'Statement 1: H₂O is polar.\nStatement 2: CO₂ is linear.', 'HTML: Paragraphs converted to clean newlines');

console.log('\n====================================================');
console.log(` SUMMARY: ${passCount} PASSED, ${failCount} FAILED OUT OF ${passCount + failCount} TESTS `);
console.log('====================================================\n');
