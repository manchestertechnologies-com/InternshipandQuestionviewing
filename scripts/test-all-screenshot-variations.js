const { formatCleanText } = require('../src/lib/pasteUtils');

console.log('====================================================');
console.log(' VERIFYING ALL 4 ITEMS FROM USER LATEST SCREENSHOT  ');
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

// Exact 4 items from user screenshot
const screenshotContent = `
(1) 10^−³ nm

(2) 10^−¹ nm

(3) 10^−² nm

(4) 10−⁴ nm
`;

const res = formatCleanText(screenshotContent);

assert(res.includes('(1) 10⁻³ nm'), 'Item (1): 10^−³ nm converted to 10⁻³ nm');
assert(res.includes('(2) 10⁻¹ nm'), 'Item (2): 10^−¹ nm converted to 10⁻¹ nm');
assert(res.includes('(3) 10⁻² nm'), 'Item (3): 10^−² nm converted to 10⁻² nm');
assert(res.includes('(4) 10⁻⁴ nm'), 'Item (4): 10−⁴ nm converted to 10⁻⁴ nm');

console.log('\nFormatted Output:\n----------------------------------------\n' + res + '\n----------------------------------------');

console.log('\n====================================================');
console.log(` SUMMARY: ${passCount} PASSED, ${failCount} FAILED OUT OF ${passCount + failCount} TESTS `);
console.log('====================================================\n');
