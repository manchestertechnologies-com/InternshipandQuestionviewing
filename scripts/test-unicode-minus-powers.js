const { formatCleanText } = require('../src/lib/pasteUtils');

console.log('====================================================');
console.log(' VERIFYING UNICODE MINUS & CARET EXPONENTS FIX      ');
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

// User screenshot exact input items (containing U+2212 Unicode Minus Sign and carets)
const item1 = "10^ −³ nm";
const item2 = "(2) 10^ −¹ nm";
const item3 = "(3) 10^ −² nm";

const res1 = formatCleanText(item1);
const res2 = formatCleanText(item2);
const res3 = formatCleanText(item3);

assert(res1 === "10⁻³ nm", `Item 1: "${item1}" -> "10⁻³ nm"`, `Got: "${res1}"`);
assert(res2 === "(2) 10⁻¹ nm", `Item 2: "${item2}" -> "(2) 10⁻¹ nm"`, `Got: "${res2}"`);
assert(res3 === "(3) 10⁻² nm", `Item 3: "${item3}" -> "(3) 10⁻² nm"`, `Got: "${res3}"`);

console.log('\n====================================================');
console.log(` SUMMARY: ${passCount} PASSED, ${failCount} FAILED OUT OF ${passCount + failCount} TESTS `);
console.log('====================================================\n');
