const { formatCleanText } = require('../src/lib/pasteUtils');

console.log('====================================================');
console.log(' VERIFYING TRUE STACKED FRACTIONS FORMATTING        ');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, output = '') {
  if (condition) {
    passCount++;
    console.log(`[PASS] Test ${passCount + failCount}: ${testName}\nOutput:\n${output}\n`);
  } else {
    failCount++;
    console.error(`[FAIL] Test ${passCount + failCount}: ${testName}\nGot Output:\n${output}\n`);
  }
}

// 1. Basic Fractions
const res1 = formatCleanText("1/2");
assert(res1.includes("───") && res1.includes("1") && res1.includes("2"), "Basic fraction 1/2 stacked", res1);

const res2 = formatCleanText("3/4");
assert(res2.includes("───") && res2.includes("3") && res2.includes("4"), "Basic fraction 3/4 stacked", res2);

// 2. Variables
const res3 = formatCleanText("a/b");
assert(res3.includes("───") && res3.includes("a") && res3.includes("b"), "Variable fraction a/b stacked", res3);

// 3. Algebraic Expressions
const res4 = formatCleanText("(a+b)/(c+d)");
assert(res4.includes("─────") && res4.includes("a+b") && res4.includes("c+d"), "Algebraic fraction (a+b)/(c+d) stacked", res4);

// 4. Polynomial Fractions
const res5 = formatCleanText("(x²+2x+1)/(x+1)");
assert(res5.includes("─────────") && res5.includes("x²+2x+1") && res5.includes("x+1"), "Polynomial fraction (x²+2x+1)/(x+1) stacked", res5);

// 5. Trigonometric Fractions
const res6 = formatCleanText("sinθ/cosθ");
assert(res6.includes("──────") && res6.includes("sinθ") && res6.includes("cosθ"), "Trig fraction sinθ/cosθ stacked", res6);

// 6. Scientific Notation Fractions
const res7 = formatCleanText("10^-3/10^-5");
assert(res7.includes("──────") && res7.includes("10⁻³") && res7.includes("10⁻⁵"), "Scientific fraction 10^-3/10^-5 -> 10⁻³/10⁻⁵ stacked", res7);

// 7. Chemistry Fractions
const res8 = formatCleanText("Na+/Cl-");
assert(res8.includes("─────") && res8.includes("Na⁺") && res8.includes("Cl⁻"), "Chemistry fraction Na+/Cl- -> Na⁺/Cl⁻ stacked", res8);

const res9 = formatCleanText("Ca2+/SO42-");
assert(res9.includes("───────") && res9.includes("Ca²⁺") && res9.includes("SO₄²⁻"), "Chemistry fraction Ca2+/SO42- -> Ca²⁺/SO₄²⁻ stacked", res9);

// 8. Mixed Text
const res10 = formatCleanText("Velocity = distance/time");
assert(res10.includes("──────────") && res10.includes("distance") && res10.includes("time"), "Mixed text Velocity = distance/time stacked", res10);

console.log('\n====================================================');
console.log(` SUMMARY: ${passCount} PASSED, ${failCount} FAILED OUT OF ${passCount + failCount} TESTS `);
console.log('====================================================\n');
