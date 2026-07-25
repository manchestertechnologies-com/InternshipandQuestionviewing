const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('   RUNNING AUTOMATED EXTRA OPTIONS TEST SUITE      ');
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
// TEST GROUP 1: Dynamic Option Letter Generator
// ----------------------------------------------------
console.log('--- TEST GROUP 1: Letter Generation ---');

function getExtraOptionLetter(index) {
  return String.fromCharCode(69 + index);
}

assert(getExtraOptionLetter(0) === 'E', 'Letter for index 0 is E');
assert(getExtraOptionLetter(1) === 'F', 'Letter for index 1 is F');
assert(getExtraOptionLetter(2) === 'G', 'Letter for index 2 is G');
assert(getExtraOptionLetter(3) === 'H', 'Letter for index 3 is H');
assert(getExtraOptionLetter(4) === 'I', 'Letter for index 4 is I');

// ----------------------------------------------------
// TEST GROUP 2: Correct Answer Dropdown Choices
// ----------------------------------------------------
console.log('\n--- TEST GROUP 2: Correct Answer Dropdown Choices ---');

function getAvailableOptions(extraOptions) {
  return ['A', 'B', 'C', 'D', ...extraOptions.map((_, idx) => getExtraOptionLetter(idx))];
}

assert(JSON.stringify(getAvailableOptions([])) === JSON.stringify(['A', 'B', 'C', 'D']), 'Default options choices: A, B, C, D');
assert(JSON.stringify(getAvailableOptions(['Opt E text'])) === JSON.stringify(['A', 'B', 'C', 'D', 'E']), 'Choices with 1 extra option: A, B, C, D, E');
assert(JSON.stringify(getAvailableOptions(['Opt E', 'Opt F', 'Opt G'])) === JSON.stringify(['A', 'B', 'C', 'D', 'E', 'F', 'G']), 'Choices with 3 extra options: A, B, C, D, E, F, G');

// ----------------------------------------------------
// TEST GROUP 3: ExtraData Packaging & Unpackaging
// ----------------------------------------------------
console.log('\n--- TEST GROUP 3: ExtraData Packaging & Unpackaging ---');

function packageExtraData(existingExtraData, extraOptions) {
  if (!extraOptions || extraOptions.length === 0) return existingExtraData || null;
  return {
    ...(existingExtraData || {}),
    additionalOptions: extraOptions,
  };
}

function unpackAllOptions(q) {
  const options = [
    { opt: 'A', text: q.optionA || '' },
    { opt: 'B', text: q.optionB || '' },
    { opt: 'C', text: q.optionC || '' },
    { opt: 'D', text: q.optionD || '' },
  ];
  const additional = q.extraData?.additionalOptions || [];
  additional.forEach((txt, idx) => {
    if (txt) {
      options.push({ opt: getExtraOptionLetter(idx), text: txt });
    }
  });
  return options;
}

const mockStatementQ = {
  optionA: 'Statement 1 & 2 are correct',
  optionB: 'Statement 2 & 3 are correct',
  optionC: 'Statement 1 & 4 are correct',
  optionD: 'All statements are correct',
  extraData: packageExtraData({ statements: ['St1', 'St2', 'St3', 'St4', 'St5'] }, ['None of the statements are correct', 'Statement 3 & 5 are correct'])
};

const allUnpacked = unpackAllOptions(mockStatementQ);
assert(allUnpacked.length === 6, 'Statement question unpacks 6 total options (A-F)');
assert(allUnpacked[4].opt === 'E' && allUnpacked[4].text === 'None of the statements are correct', 'Option E unpacked correctly');
assert(allUnpacked[5].opt === 'F' && allUnpacked[5].text === 'Statement 3 & 5 are correct', 'Option F unpacked correctly');

console.log('\n====================================================');
console.log(` SUMMARY: ${passCount} PASSED, ${failCount} FAILED OUT OF ${passCount + failCount} TESTS `);
console.log('====================================================\n');
