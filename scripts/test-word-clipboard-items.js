const { handleRichPaste, parseRichTextToUnicode } = require('../src/lib/pasteUtils');

console.log('====================================================');
console.log(' VERIFYING WORD PASTE INTERCEPTION (TEXT + IMAGE)   ');
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

// Simulated ClipboardEvent when copying from MS Word on Windows (contains text/plain, text/html AND image/png item)
let lastValue = '';
const mockWordClipboardEvent = {
  clipboardData: {
    items: [
      { type: 'image/png' },
      { type: 'text/html' },
      { type: 'text/plain' }
    ],
    getData: (format) => {
      if (format === 'text/plain') return 'Statement I: PCl3 reacts with H2O to form H3PO3.';
      if (format === 'text/html') return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><style>p.MsoNormal{mso-style-name:Normal;}</style><!--[if gte mso 9]><xml><w:WordDocument><w:View>Normal</w:View><w:Zoom>0</w:Zoom><w:TrackMoves>false</w:TrackMoves><w:LidThemeOther>EN-IN</w:LidThemeOther></w:WordDocument></xml><![endif]--></head><body><p class="MsoNormal">Statement I: PCl3 reacts with H2O to form H3PO3.</p></body></html>`;
      return '';
    }
  },
  preventDefault: () => {},
  currentTarget: { selectionStart: 0, selectionEnd: 0, focus: () => {}, setSelectionRange: () => {} }
};

const result = handleRichPaste(mockWordClipboardEvent, '', (newVal) => {
  lastValue = newVal;
});

assert(result === true, 'handleRichPaste returned true (intercepted Word paste event)');
assert(!lastValue.includes('Normal'), 'Word metadata "Normal" is NOT in pasted text');
assert(!lastValue.includes('false'), 'Word metadata "false" is NOT in pasted text');
assert(!lastValue.includes('EN-IN'), 'Word metadata "EN-IN" is NOT in pasted text');
assert(lastValue.includes('PCl₃'), 'Chemical formula PCl3 auto-converted to PCl₃');
assert(lastValue.includes('H₂O'), 'Chemical formula H2O auto-converted to H₂O');

console.log('\nPasted Value in Field:\n----------------------------------------\n' + lastValue + '\n----------------------------------------');

console.log('\n====================================================');
console.log(` SUMMARY: ${passCount} PASSED, ${failCount} FAILED OUT OF ${passCount + failCount} TESTS `);
console.log('====================================================\n');
