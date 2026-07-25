const { formatCleanText } = require('../src/lib/pasteUtils');

console.log('====================================================');
console.log(' VERIFYING IONIC CHARGES & CHEMISTRY FORMATTING     ');
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

const tests = [
  // Monoatomic Ions & Caret Variations
  { raw: "S2-", expected: "S²⁻", name: "S2- -> S²⁻" },
  { raw: "S^2-", expected: "S²⁻", name: "S^2- -> S²⁻" },
  { raw: "S²^-", expected: "S²⁻", name: "S²^- -> S²⁻" },
  { raw: "S2^-", expected: "S²⁻", name: "S2^- -> S²⁻" },
  { raw: "S²^–", expected: "S²⁻", name: "S²^– -> S²⁻" },
  { raw: "Cl-", expected: "Cl⁻", name: "Cl- -> Cl⁻" },
  { raw: "Cl^-", expected: "Cl⁻", name: "Cl^- -> Cl⁻" },
  { raw: "K+", expected: "K⁺", name: "K+ -> K⁺" },
  { raw: "K^+", expected: "K⁺", name: "K^+ -> K⁺" },
  { raw: "Ca2+", expected: "Ca²⁺", name: "Ca2+ -> Ca²⁺" },
  { raw: "Ca^2+", expected: "Ca²⁺", name: "Ca^2+ -> Ca²⁺" },
  { raw: "Ca²^+", expected: "Ca²⁺", name: "Ca²^+ -> Ca²⁺" },
  { raw: "Fe3+", expected: "Fe³⁺", name: "Fe3+ -> Fe³⁺" },
  { raw: "Cu2+", expected: "Cu²⁺", name: "Cu2+ -> Cu²⁺" },
  { raw: "Al3+", expected: "Al³⁺", name: "Al3+ -> Al³⁺" },

  // Polyatomic Ions
  { raw: "SO4^2-", expected: "SO₄²⁻", name: "SO4^2- -> SO₄²⁻" },
  { raw: "CO3^2-", expected: "CO₃²⁻", name: "CO3^2- -> CO₃²⁻" },
  { raw: "NO3^-", expected: "NO₃⁻", name: "NO3^- -> NO₃⁻" },
  { raw: "NH4^+", expected: "NH₄⁺", name: "NH4^+ -> NH₄⁺" },
  { raw: "PO4^3-", expected: "PO₄³⁻", name: "PO4^3- -> PO₄³⁻" },
  { raw: "HCO3^-", expected: "HCO₃⁻", name: "HCO3^- -> HCO₃⁻" },
  { raw: "MnO4^-", expected: "MnO₄⁻", name: "MnO4^- -> MnO₄⁻" },
  { raw: "Cr2O7^2-", expected: "Cr₂O₇²⁻", name: "Cr2O7^2- -> Cr₂O₇²⁻" },

  // Neutral Molecules
  { raw: "H2O", expected: "H₂O", name: "H2O -> H₂O" },
  { raw: "CO2", expected: "CO₂", name: "CO2 -> CO₂" },
  { raw: "NH3", expected: "NH₃", name: "NH3 -> NH₃" },
  { raw: "H2SO4", expected: "H₂SO₄", name: "H2SO4 -> H₂SO₄" },
  { raw: "HNO3", expected: "HNO₃", name: "HNO3 -> HNO₃" },
  { raw: "CH4", expected: "CH₄", name: "CH4 -> CH₄" },

  // Scientific Notation Coexistence
  { raw: "10^-3 nm", expected: "10⁻³ nm", name: "10^-3 nm -> 10⁻³ nm" },
  { raw: "5×10^-6 m", expected: "5×10⁻⁶ m", name: "5×10^-6 m -> 5×10⁻⁶ m" },
  { raw: "2.5×10^6 kg", expected: "2.5×10⁶ kg", name: "2.5×10^6 kg -> 2.5×10⁶ kg" }
];

tests.forEach((t) => {
  const result = formatCleanText(t.raw);
  assertEqual(result, t.expected, t.name);
});

console.log('\n====================================================');
console.log(` SUMMARY: ${passCount} PASSED, ${failCount} FAILED OUT OF ${passCount + failCount} TESTS `);
console.log('====================================================\n');
