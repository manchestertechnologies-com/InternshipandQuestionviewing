const { parseRichTextToUnicode } = require('../src/lib/pasteUtils');

console.log('====================================================');
console.log(' VERIFYING WORD METADATA SANITIZATION & PASTE FIX  ');
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

// Simulated HTML clipboard payload copied from Microsoft Word containing Document Properties & Style XML
const sampleWordHtmlData = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
<meta name="Title" content="">
<meta name="Keywords" content="">
<style>
p.MsoNormal, li.MsoNormal, div.MsoNormal
	{mso-style-name:Normal;
	mso-style-parent:"";
	margin:0in;
	font-size:12.0pt;
	font-family:"Times New Roman",serif;}
</style>
<!--[if gte mso 9]><xml>
 <o:DocumentProperties>
  <o:Template>Normal</o:Template>
  <o:Revision>0</o:Revision>
  <o:HyperlinksChanged>false</o:HyperlinksChanged>
  <o:Language>EN-IN</o:Language>
 </o:DocumentProperties>
 <o:OfficeDocumentSettings>
  <o:AllowPNG/>
 </o:OfficeDocumentSettings>
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
assert(!resultText.includes('false'), 'Word metadata "false" is 100% stripped');
assert(!resultText.includes('EN-IN'), 'Word metadata "EN-IN" is 100% stripped');
assert(resultText.includes('Statement I: PCl₃ reacts with H₂O to form H₃PO₃.'), 'Clean question text Statement I extracted with subscripts');
assert(resultText.includes('Statement II: SOCl₂ reacts with alcohols to form R-Cl.'), 'Clean question text Statement II extracted with subscripts');

console.log('\nResult output:\n----------------------------------------\n' + resultText + '\n----------------------------------------');

console.log('\n====================================================');
console.log(` SUMMARY: ${passCount} PASSED, ${failCount} FAILED OUT OF ${passCount + failCount} TESTS `);
console.log('====================================================\n');
