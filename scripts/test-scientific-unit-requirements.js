const { formatCleanText } = require('../src/lib/pasteUtils');

console.log('====================================================');
console.log(' VERIFYING ALL 10 SCIENTIFIC & UNIT REQUIREMENTS    ');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assertEqual(actual, expected, testName) {
  if (actual === expected) {
    passCount++;
    console.log(`[PASS] Test ${passCount + failCount}: ${testName}\n       Result: "${actual}"`);
  } else {
    failCount++;
    console.error(`[FAIL] Test ${passCount + failCount}: ${testName}\n       Expected: "${expected}"\n       Got:      "${actual}"`);
  }
}

// Requirement 9 Regression Test Cases
const regressionTests = [
  { raw: "10^-1 nm", expected: "10⁻¹ nm", name: "10^-1 nm -> 10⁻¹ nm" },
  { raw: "10^-2 nm", expected: "10⁻² nm", name: "10^-2 nm -> 10⁻² nm" },
  { raw: "10^-3 nm", expected: "10⁻³ nm", name: "10^-3 nm -> 10⁻³ nm" },
  { raw: "10^-4 pm", expected: "10⁻⁴ pm", name: "10^-4 pm -> 10⁻⁴ pm" },
  { raw: "10^-6 μm", expected: "10⁻⁶ μm", name: "10^-6 μm -> 10⁻⁶ μm" },
  { raw: "10^-10 Å", expected: "10⁻¹⁰ Å", name: "10^-10 Å -> 10⁻¹⁰ Å" },
  { raw: "5×10^-3 m", expected: "5×10⁻³ m", name: "5×10^-3 m -> 5×10⁻³ m" },
  { raw: "2.5×10^6 kg", expected: "2.5×10⁶ kg", name: "2.5×10^6 kg -> 2.5×10⁶ kg" },
  { raw: "10^5 cm", expected: "10⁵ cm", name: "10^5 cm -> 10⁵ cm" },
  { raw: "10^6 m", expected: "10⁶ m", name: "10^6 m -> 10⁶ m" }
];

regressionTests.forEach((t) => {
  const result = formatCleanText(t.raw);
  assertEqual(result, t.expected, t.name);
});

// Requirement 8 Chemistry Compatibility
const chemistryTests = [
  { raw: "H2O", expected: "H₂O", name: "H2O -> H₂O" },
  { raw: "CO2", expected: "CO₂", name: "CO2 -> CO₂" },
  { raw: "SO42-", expected: "SO₄²⁻", name: "SO42- -> SO₄²⁻" },
  { raw: "NO3-", expected: "NO₃⁻", name: "NO3- -> NO₃⁻" },
  { raw: "CaCO3", expected: "CaCO₃", name: "CaCO3 -> CaCO₃" },
  { raw: "Fe3+", expected: "Fe³⁺", name: "Fe3+ -> Fe³⁺" },
  { raw: "Cu2+", expected: "Cu²⁺", name: "Cu2+ -> Cu²⁺" },
  { raw: "NH4+", expected: "NH₄⁺", name: "NH4+ -> NH₄⁺" }
];

console.log('\n--- Chemistry Compatibility Tests ---');
chemistryTests.forEach((t) => {
  const result = formatCleanText(t.raw);
  assertEqual(result, t.expected, t.name);
});

console.log('\n====================================================');
console.log(` SUMMARY: ${passCount} PASSED, ${failCount} FAILED OUT OF ${passCount + failCount} TESTS `);
console.log('====================================================\n');
