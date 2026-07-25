const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Include project node_modules
module.paths.push(path.join(__dirname, '../node_modules'));

console.log('====================================================');
console.log(' RUNNING AUTOMATED SUITE (PDF, CLOUDINARY, REPORTS) ');
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

// Read .env configuration
let cloudName = '';
let apiKey = '';
let apiSecret = '';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v) {
      const val = v.join('=').trim().replace(/^["']|["']$/g, '');
      if (k.trim() === 'CLOUDINARY_CLOUD_NAME') cloudName = val;
      if (k.trim() === 'CLOUDINARY_API_KEY') apiKey = val;
      if (k.trim() === 'CLOUDINARY_API_SECRET') apiSecret = val;
      process.env[k.trim()] = val;
    }
  });
} catch (e) {}

async function runTests() {
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

  // ----------------------------------------------------
  // TEST GROUP 1: Cloudinary Signed Download Generation
  // ----------------------------------------------------
  console.log('--- TEST GROUP 1: Cloudinary API & Signed Downloads ---');
  
  const testPublicId = 'manchester-tech/tasks/nxdp1ps7mk8q4d5glylq.pdf';
  const signedUrl = cloudinary.utils.private_download_url(testPublicId, 'pdf', {
    resource_type: 'raw',
    type: 'upload'
  });

  assert(signedUrl.includes('api.cloudinary.com'), 'Cloudinary private_download_url returns api.cloudinary.com host');
  assert(signedUrl.includes('signature='), 'Cloudinary private_download_url includes security signature');
  assert(signedUrl.includes('api_key='), 'Cloudinary private_download_url includes API key parameter');

  // Verify fetch of signed URL returns 200 OK and valid PDF bytes
  await new Promise((resolve) => {
    https.get(signedUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      assert(res.statusCode === 200, 'Cloudinary Private Download URL returns HTTP 200 OK', `Got HTTP ${res.statusCode}`);
      let dataLen = 0;
      res.on('data', chunk => dataLen += chunk.length);
      res.on('end', () => {
        assert(dataLen > 1000000, `Cloudinary Private Download returns full PDF data (>1MB)`, `Received ${dataLen} bytes`);
        resolve();
      });
    }).on('error', (err) => {
      assert(false, 'Cloudinary Private Download network request succeeded', err.message);
      resolve();
    });
  });

  // ----------------------------------------------------
  // TEST GROUP 2: MIME Type & Content Disposition Header Logic
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 2: MIME & Header Formatting ---');

  function getMimeType(filename, url) {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const isPdf = ext === 'pdf' || url.toLowerCase().includes('.pdf') || filename.toLowerCase().includes('.pdf');
    if (isPdf) return 'application/pdf';
    if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (ext === 'doc') return 'application/msword';
    if (ext === 'zip') return 'application/zip';
    if (ext === 'png') return 'image/png';
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    return 'application/octet-stream';
  }

  assert(getMimeType('test.pdf', 'https://example.com/test.pdf') === 'application/pdf', 'MIME: PDF file mapped correctly');
  assert(getMimeType('Alternating Current (1).pdf', 'https://res.cloudinary.com/raw/upload/file.pdf') === 'application/pdf', 'MIME: PDF with spaces mapped correctly');
  assert(getMimeType('report.docx', 'https://example.com/report.docx') === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'MIME: DOCX file mapped correctly');
  assert(getMimeType('archive.zip', 'https://example.com/archive.zip') === 'application/zip', 'MIME: ZIP archive mapped correctly');

  function formatDisposition(filename, isInline = false) {
    const safeFilename = filename.replace(/["\r\n]/g, '_');
    const encodedFilename = encodeURIComponent(filename);
    const dispositionType = isInline ? 'inline' : 'attachment';
    return `${dispositionType}; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`;
  }

  const dispHeader = formatDisposition('Alternating Current (1).pdf');
  assert(dispHeader.includes('attachment;'), 'Header: Disposition is attachment by default');
  assert(dispHeader.includes('filename="Alternating Current (1).pdf"'), 'Header: Safe filename included in double quotes');
  assert(dispHeader.includes("filename*=UTF-8''Alternating%20Current%20(1).pdf"), 'Header: UTF-8 encoded filename included for modern browsers');

  // ----------------------------------------------------
  // TEST GROUP 3: Authorization & Group Matching Logic
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 3: Authorization & Case-Insensitive Group Matching ---');

  function isMentorAuthorized(userGroup, mentorGroup, userMentorId, mentorProfileId, userRole) {
    if (userRole === 'ADMIN') return true;
    if (userRole !== 'MENTOR') return false;
    const subGroup = (userGroup || '').trim().toLowerCase();
    const mGroup = (mentorGroup || '').trim().toLowerCase();
    const isGroupMatch = subGroup !== '' && subGroup === mGroup;
    const isMentorMatch = mentorProfileId && userMentorId === mentorProfileId;
    return isGroupMatch || isMentorMatch;
  }

  assert(isMentorAuthorized('GROUP 1', 'group 1', null, 'm1', 'MENTOR') === true, 'Auth: Case-insensitive group match ("GROUP 1" vs "group 1")');
  assert(isMentorAuthorized('Group A ', ' group a', null, 'm1', 'MENTOR') === true, 'Auth: Trimmed group match ("Group A " vs " group a")');
  assert(isMentorAuthorized('GROUP 2', 'GROUP 1', 'm1', 'm1', 'MENTOR') === true, 'Auth: Direct mentor ID match fallback');
  assert(isMentorAuthorized('GROUP 2', 'GROUP 1', 'm2', 'm1', 'MENTOR') === false, 'Auth: Reject mismatching group and mismatching mentor ID');
  assert(isMentorAuthorized('GROUP 2', 'GROUP 1', 'm2', 'm1', 'ADMIN') === true, 'Auth: ADMIN role bypasses group restriction');

  // ----------------------------------------------------
  // TEST GROUP 4: Database Submission Resolution Logic
  // ----------------------------------------------------
  console.log('\n--- TEST GROUP 4: Database Submission Parameter Auto-Fill ---');

  function resolveDownloadParams(submissionId, searchUrl, searchFilename, mockSubmission) {
    let fileUrl = searchUrl;
    let filename = searchFilename || 'download';
    if (submissionId && mockSubmission) {
      if (!fileUrl) fileUrl = mockSubmission.fileUrl;
      if (!filename || filename === 'download') filename = mockSubmission.fileName || 'Weekly_Report.pdf';
    }
    return { fileUrl, filename };
  }

  const mockSub = { fileUrl: 'https://res.cloudinary.com/x5gin721/raw/upload/v1/report.pdf', fileName: 'John_Doe_Week1.pdf' };
  const res1 = resolveDownloadParams('sub-123', null, null, mockSub);
  assert(res1.fileUrl === mockSub.fileUrl, 'Param Auto-Fill: fileUrl extracted from database record when missing from URL');
  assert(res1.filename === mockSub.fileName, 'Param Auto-Fill: filename extracted from database record when missing from URL');

  const res2 = resolveDownloadParams('sub-123', 'https://override.com/file.pdf', 'Override.pdf', mockSub);
  assert(res2.fileUrl === 'https://override.com/file.pdf', 'Param Auto-Fill: Explicit url parameter takes precedence if provided');

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(` SUMMARY: ${passCount} PASSED, ${failCount} FAILED OUT OF ${passCount + failCount} TESTS `);
  console.log('====================================================\n');
}

runTests();
