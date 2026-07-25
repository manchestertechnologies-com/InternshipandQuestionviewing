console.log('====================================================');
console.log(' VERIFYING STATEMENT-BASED SINGLE QUESTION BOX FLOW ');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName) {
  if (condition) {
    passCount++;
    console.log(`[PASS] Test ${passCount + failCount}: ${testName}`);
  } else {
    failCount++;
    console.error(`[FAIL] Test ${passCount + failCount}: ${testName}`);
  }
}

// Mock Statement-Based question entered in a single Question Text box
const singleBoxStatementQuestion = {
  questionText: `Given below are two statements:
Statement I: PCl₃ and PBr₃ react with alcohols to give alkyl halides.
Statement II: SOCl₂ reaction with alcohols yields pure alkyl chlorides.
Statement III: NaNO₂/HCl at 0-5°C forms diazonium salts.

In the light of the above statements, choose the most appropriate answer from the options given below:`,
  optionA: 'Statement I and Statement II are correct',
  optionB: 'Statement I and Statement III are correct',
  optionC: 'Statement II and Statement III are correct',
  optionD: 'All Statement I, II and III are correct',
  extraData: {
    additionalOptions: [
      'None of the statements are correct',
      'Only Statement II is correct'
    ]
  },
  questionType: 'STATEMENT_BASED'
};

assert(singleBoxStatementQuestion.questionText.includes('Statement I:'), 'Question text contains Statement I in single box');
assert(singleBoxStatementQuestion.questionText.includes('Statement II:'), 'Question text contains Statement II in single box');
assert(singleBoxStatementQuestion.questionText.includes('Statement III:'), 'Question text contains Statement III in single box');
assert(singleBoxStatementQuestion.optionA !== '', 'Option A is populated');
assert(singleBoxStatementQuestion.extraData.additionalOptions.length === 2, 'Extra options (E and F) attached cleanly');

console.log('\n====================================================');
console.log(` SUMMARY: ${passCount} PASSED, ${failCount} FAILED OUT OF ${passCount + failCount} TESTS `);
console.log('====================================================\n');
