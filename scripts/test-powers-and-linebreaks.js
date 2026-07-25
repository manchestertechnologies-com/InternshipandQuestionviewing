const { formatCleanText } = require('../src/lib/pasteUtils');

console.log('====================================================');
console.log(' VERIFYING POWERS, CHARGES & ACCIDENTAL LINE BREAKS');
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

// User screenshot exact input text copied from Word/PDF
const userScreenshotRawInput = `
(ii) CH4
< CCl4 < CF4 : Electronegativity of central
'C'-atom

(iii) Ca2+
< Na+ < S2^-- < Se2^-- : Ionic radius

(iv) Ni
> Pd > Pt : Ionisation energy
`;

const resultText = formatCleanText(userScreenshotRawInput);

assert(resultText.includes('Ca²⁺'), 'Ca2+ converted to Ca²⁺ (power/charge superscript)');
assert(resultText.includes('Na⁺'), 'Na+ converted to Na⁺ (power/charge superscript)');
assert(resultText.includes('S²⁻'), 'S2^-- converted to S²⁻ (clean power/charge superscript)');
assert(resultText.includes('Se²⁻'), 'Se2^-- converted to Se²⁻ (clean power/charge superscript)');
assert(resultText.includes("Electronegativity of central 'C'-atom"), 'Accidental line break central\\n\'C\'-atom joined into single line');

// Additional test for S²^-- input explicitly (where ² was already a superscript character)
const explicitUnicodeInput = "(iii) Ca²⁺ < Na⁺ < S²^-- < Se²^-- : Ionic radius";
const explicitResult = formatCleanText(explicitUnicodeInput);
assert(explicitResult.includes('S²⁻') && !explicitResult.includes('^--'), 'S²^-- cleaned to S²⁻ without caret or double minus');
assert(explicitResult.includes('Se²⁻') && !explicitResult.includes('^--'), 'Se²^-- cleaned to Se²⁻ without caret or double minus');

console.log('\nFormatted Output:\n----------------------------------------\n' + resultText + '\n----------------------------------------');

console.log('\n====================================================');
console.log(` SUMMARY: ${passCount} PASSED, ${failCount} FAILED OUT OF ${passCount + failCount} TESTS `);
console.log('====================================================\n');
