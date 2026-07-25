const { formatCleanText } = require('../src/lib/pasteUtils');

console.log('====================================================');
console.log(' VERIFYING SCIENTIFIC NEGATIVE EXPONENTS FORMATTING ');
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

// User screenshot exact input text containing 1.8 x 10^- 5 or 1.8 x 10^- ⁵
const userScreenshotInput = "Equal volumes of 0.1 M CH3COOH and 0.05 M NaOH are mixed. If Ka for CH3COOH = 1.8 x 10^- 5, the resulting solution is:";
const formattedResult = formatCleanText(userScreenshotInput);

assert(formattedResult.includes('1.8 × 10⁻⁵'), '1.8 x 10^- 5 converted to 1.8 × 10⁻⁵ (exact negative exponent superscript)');
assert(formattedResult.includes('CH₃COOH'), 'CH3COOH converted to CH₃COOH');
assert(formattedResult.includes('Kₐ'), 'Ka converted to Kₐ');

// Testing variations of negative powers with spaces/carets
const variations = [
  { raw: "10^-5", expected: "10⁻⁵" },
  { raw: "10^- 5", expected: "10⁻⁵" },
  { raw: "10^- ⁵", expected: "10⁻⁵" },
  { raw: "10^-3", expected: "10⁻³" },
  { raw: "10^-14", expected: "10⁻¹⁴" },
  { raw: "1.8 x 10^-5", expected: "1.8 × 10⁻⁵" }
];

variations.forEach((v, i) => {
  const res = formatCleanText(v.raw);
  assert(res === v.expected, `Variation ${i+1}: "${v.raw}" -> "${v.expected}"`, `Got: "${res}"`);
});

console.log('\nUser Screenshot Formatted Result:\n----------------------------------------\n' + formattedResult + '\n----------------------------------------');

console.log('\n====================================================');
console.log(` SUMMARY: ${passCount} PASSED, ${failCount} FAILED OUT OF ${passCount + failCount} TESTS `);
console.log('====================================================\n');
