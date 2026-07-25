const { parseRichTextToUnicode } = require('../src/lib/pasteUtils');

console.log('====================================================');
console.log(' VERIFYING WORD NAMESPACE METADATA SANITIZATION     ');
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

// Exact Word clipboard payload containing <w:View>Normal</w:View>, <w:Zoom>0</w:Zoom>, <w:TrackMoves>false</w:TrackMoves>, <w:LidThemeOther>EN-IN</w:LidThemeOther>
const sampleWordHtmlData = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta name="Title" content="">
<style>
p.MsoNormal, li.MsoNormal, div.MsoNormal
	{mso-style-name:Normal;
	font-size:12.0pt;}
</style>
<!--[if gte mso 9]><xml>
 <w:WordDocument>
  <w:View>Normal</w:View>
  <w:Zoom>0</w:Zoom>
  <w:TrackMoves>false</w:TrackMoves>
  <w:TrackFormatting>false</w:TrackFormatting>
  <w:DoNotPromoteKF/>
  <w:LidThemeOther>EN-IN</w:LidThemeOther>
 </w:WordDocument>
 <o:DocumentProperties>
  <o:Template>Normal</o:Template>
  <o:Revision>0</o:Revision>
 </o:DocumentProperties>
</xml><![endif]-->
</head>
<body>
<p class="MsoNormal">Statement I: PCl3 reacts with H2O to form H3PO3.</p>
<p class="MsoNormal">Statement II: SOCl2 reacts with alcohols to form R-Cl.</p>
</body>
</html>
`;

const resultText = parseRichTextToUnicode(sampleWordHtmlData);

assert(!resultText.includes('Normal'), 'Word metadata "Normal" is 100% stripped');
assert(!resultText.includes('0'), 'Word metadata "0" is 100% stripped');
assert(!resultText.includes('false'), 'Word metadata "false" is 100% stripped');
assert(!resultText.includes('EN-IN'), 'Word metadata "EN-IN" is 100% stripped');
assert(resultText.includes('Statement I: PCl₃ reacts with H₂O to form H₃PO₃.'), 'Clean question text Statement I extracted with subscripts');
assert(resultText.includes('Statement II: SOCl₂ reacts with alcohols to form R-Cl.'), 'Clean question text Statement II extracted with subscripts');

console.log('\nResult output:\n----------------------------------------\n' + resultText + '\n----------------------------------------');

console.log('\n====================================================');
console.log(` SUMMARY: ${passCount} PASSED, ${failCount} FAILED OUT OF ${passCount + failCount} TESTS `);
console.log('====================================================\n');
