import { formatCleanText, parseRichTextToUnicode } from '../src/lib/pasteUtils';

console.log('====================================================');
console.log(' VERIFYING FRACTION FORMATTER & REGRESSION TESTS    ');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string, output: string = '') {
  if (condition) {
    passCount++;
    console.log(`[PASS] Test ${passCount + failCount}: ${testName}\nOutput:\n${output}\n`);
  } else {
    failCount++;
    console.error(`[FAIL] Test ${passCount + failCount}: ${testName}\nGot Output:\n${output}\n`);
  }
}

// 1. All 10 Required Regression Tests
const res1 = formatCleanText('1/2');
assert(res1.includes('───') && res1.includes('1') && res1.includes('2'), 'Regression 1: 1/2 stacked', res1);

const res2 = formatCleanText('3/4');
assert(res2.includes('───') && res2.includes('3') && res2.includes('4'), 'Regression 2: 3/4 stacked', res2);

const res3 = formatCleanText('a/b');
assert(res3.includes('───') && res3.includes('a') && res3.includes('b'), 'Regression 3: a/b stacked', res3);

const res4 = formatCleanText('x/y');
assert(res4.includes('───') && res4.includes('x') && res4.includes('y'), 'Regression 4: x/y stacked', res4);

const res5 = formatCleanText('(x+y)/(a+b)');
assert(res5.includes('─────') && res5.includes('x+y') && res5.includes('a+b'), 'Regression 5: (x+y)/(a+b) stacked', res5);

const res6 = formatCleanText('(x²+y²)/(a²+b²)');
assert(res6.includes('───────') && res6.includes('x²+y²') && res6.includes('a²+b²'), 'Regression 6: (x²+y²)/(a²+b²) stacked', res6);

const res7 = formatCleanText('sinθ/cosθ');
assert(res7.includes('──────') && res7.includes('sinθ') && res7.includes('cosθ'), 'Regression 7: sinθ/cosθ stacked', res7);

const res8 = formatCleanText('Ca²⁺/SO₄²⁻');
assert(res8.includes('───────') && res8.includes('Ca²⁺') && res8.includes('SO₄²⁻'), 'Regression 8: Ca²⁺/SO₄²⁻ stacked', res8);

const res9 = formatCleanText('10⁻³/10⁻⁶');
assert(res9.includes('──────') && res9.includes('10⁻³') && res9.includes('10⁻⁶'), 'Regression 9: 10⁻³/10⁻⁶ stacked', res9);

const res10 = formatCleanText('((a+b)/(c+d))');
assert(res10.includes('─────') && res10.includes('a+b') && res10.includes('c+d') && !res10.includes('(\n'), 'Regression 10: ((a+b)/(c+d)) stacked without orphan parens', res10);

// 2. User Screenshot Case: m=x2-x1/y2-y1
const resUserScreen = formatCleanText('m=x2-x1/y2-y1');
assert(resUserScreen.includes('───────') && resUserScreen.includes('x2-x1') && resUserScreen.includes('y2-y1'), 'User Screenshot Formula: m=x2-x1/y2-y1 stacked', resUserScreen);

// 3. English "or" vs. Division Disambiguation Tests
const textOrCases = [
  'and/or',
  'true/false',
  'input/output',
  'pass/fail',
  'male/female',
  'yes/no',
  'Option A/B',
  'either/or',
  'increase/decrease'
];

textOrCases.forEach((item) => {
  const res = formatCleanText(item);
  assert(res === item, `"or" Disambiguation: ${item} preserved inline`, res);
});

// 4. Word Equation OMML / HTML Import Test
const wordEquationHtml = '<m:f><m:num><m:t>x+y</m:t></m:num><m:den><m:t>a+b</m:t></m:den></m:f>';
const wordRes = parseRichTextToUnicode(wordEquationHtml);
assert(wordRes.includes('─────') && wordRes.includes('x+y') && wordRes.includes('a+b'), 'Word Equation OMML fraction converted to stacked fraction', wordRes);

console.log('====================================================');
console.log(` SUMMARY: ${passCount} PASSED, ${failCount} FAILED OUT OF ${passCount + failCount} TESTS `);
console.log('====================================================\n');
