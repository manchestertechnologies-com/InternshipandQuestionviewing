const { autoFormatChemicalSubscripts } = require('../src/lib/pasteUtils');

console.log('====================================================');
console.log(' VERIFYING ALL 18 ROWS FROM USER IMAGE (CHEMICALS)  ');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assertEqual(actual, expected, rowNum, label) {
  if (actual === expected) {
    passCount++;
    console.log(`[PASS] Row ${rowNum}: ${label}\n       Result: ${actual}`);
  } else {
    failCount++;
    console.error(`[FAIL] Row ${rowNum}: ${label}\n       Expected: ${expected}\n       Got:      ${actual}`);
  }
}

const testRows = [
  { raw: "PCl3, PBr3, PI3", expected: "PCl₃, PBr₃, PI₃", label: "PCl3, PBr3, PI3" },
  { raw: "SOCl2, PCl5", expected: "SOCl₂, PCl₅", label: "SOCl2, PCl5" },
  { raw: "HCl/ZnCl2, HBr, HI", expected: "HCl/ZnCl₂, HBr, HI", label: "HCl/ZnCl2, HBr, HI" },
  { raw: "Cl2/Fe or FeCl3", expected: "Cl₂/Fe or FeCl₃", label: "Cl2/Fe or FeCl3" },
  { raw: "NaNO2/HCl 0-50C", expected: "NaNO₂/HCl 0-5°C", label: "NaNO2/HCl 0-50C" },
  { raw: "CuCl, CuBr, CuCN, KI, H2O, H3PO2", expected: "CuCl, CuBr, CuCN, KI, H₂O, H₃PO₂", label: "CuCl, CuBr, CuCN, KI, H2O, H3PO2" },
  { raw: "HBF4 or NaBF4", expected: "HBF₄ or NaBF₄", label: "HBF4 or NaBF4" },
  { raw: "AgF or Hg2F2 or SbF3 or CoF2", expected: "AgF or Hg₂F₂ or SbF₃ or CoF₂", label: "AgF or Hg2F2 or SbF3 or CoF2" },
  { raw: "Na / dry ether", expected: "Na / dry ether", label: "Na / dry ether" },
  { raw: "NaOH 623/443/368K", expected: "NaOH 623/443/368K", label: "NaOH 623/443/368K (Temperature K preserved)" },
  { raw: "Br2 /FeBr3", expected: "Br₂ /FeBr₃", label: "Br2 /FeBr3" },
  { raw: "Cl2 /FeCl3", expected: "Cl₂ /FeCl₃", label: "Cl2 /FeCl3" },
  { raw: "CH3Cl /AlCl3", expected: "CH₃Cl /AlCl₃", label: "CH3Cl /AlCl3" },
  { raw: "CH3-CO-Cl /AlCl3", expected: "CH₃-CO-Cl /AlCl₃", label: "CH3-CO-Cl /AlCl3" },
  { raw: "H2SO4 /HNO3", expected: "H₂SO₄ /HNO₃", label: "H2SO4 /HNO3" },
  { raw: "(CH3CO)2O /AlCl3", expected: "(CH₃CO)₂O /AlCl₃", label: "(CH3CO)2O /AlCl3" },
  { raw: "H2SO4", expected: "H₂SO₄", label: "H2SO4" },
  { raw: "H2O/ H2SO4", expected: "H₂O/ H₂SO₄", label: "H2O/ H2SO4" }
];

testRows.forEach((row, idx) => {
  const result = autoFormatChemicalSubscripts(row.raw);
  assertEqual(result, row.expected, idx + 1, row.label);
});

console.log('\n====================================================');
console.log(` SUMMARY: ${passCount} PASSED, ${failCount} FAILED OUT OF ${testRows.length} ROWS `);
console.log('====================================================\n');
