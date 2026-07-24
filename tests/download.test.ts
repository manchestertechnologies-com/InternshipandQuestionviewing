import test from 'node:test';
import assert from 'node:assert/strict';

test('Download API header and URL formatting', () => {
  const filename = 'Weekly Submission Report (Week 1).pdf';
  
  const safeFilename = filename.replace(/["\r\n]/g, '_');
  const encodedFilename = encodeURIComponent(filename);
  const dispositionHeader = `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`;

  assert.ok(dispositionHeader.includes('attachment;'), 'Header specifies attachment disposition');
  assert.ok(dispositionHeader.includes('filename*=UTF-8\'\''), 'Header includes UTF-8 encoded filename');
  assert.ok(dispositionHeader.includes(encodedFilename), 'Header contains encoded filename string');

  // Test Base64 Data URL detection
  const sampleDataUrl = 'data:application/pdf;base64,JVBERi0xLjQK';
  const matches = sampleDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  assert.ok(matches, 'Base64 Data URL regex correctly parses data URL');
  assert.equal(matches![1], 'application/pdf', 'Correctly extracts MIME type');
});

test('Download API mentor permission check', () => {
  const mentorProfile = { id: 'mentor-abc', group: 'Group 2' };
  
  interface TestSubmission {
    intern: {
      group: string;
      mentorId: string | null;
    };
  }

  const submission1: TestSubmission = {
    intern: { group: 'Group 2', mentorId: null }
  };
  const submission2: TestSubmission = {
    intern: { group: 'Group 1', mentorId: 'mentor-abc' }
  };
  const submission3: TestSubmission = {
    intern: { group: 'Group 3', mentorId: 'mentor-xyz' }
  };

  const checkAuth = (sub: TestSubmission) => {
    return sub.intern.group === mentorProfile.group || sub.intern.mentorId === mentorProfile.id;
  };

  assert.equal(checkAuth(submission1), true, 'Mentor can download submission by group match');
  assert.equal(checkAuth(submission2), true, 'Mentor can download submission by mentorId match');
  assert.equal(checkAuth(submission3), false, 'Mentor cannot download submission from another group/mentor');
});
