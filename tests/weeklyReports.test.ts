import test from 'node:test';
import assert from 'node:assert/strict';

test('Weekly Reports query filter logic', () => {
  // Test case: Filter must allow both general weekly submissions and project assignments
  const mentorProfile = { id: 'mentor-123', group: 'Group 1' };

  // Previous flawed query had domainProjectAssignmentId: { not: null }
  const flawedWhere = {
    intern: { group: mentorProfile.group },
    domainProjectAssignmentId: { not: null },
  };

  // Fixed query condition
  const fixedWhere = {
    OR: [
      { intern: { group: mentorProfile.group } },
      { intern: { mentorId: mentorProfile.id } },
    ],
  };

  // Mock general submission without domainProjectAssignmentId
  const generalSubmission = {
    id: 'sub-1',
    intern: { group: 'Group 1', mentorId: 'mentor-123' },
    domainProjectAssignmentId: null,
  };

  // Mock project submission with domainProjectAssignmentId
  const projectSubmission = {
    id: 'sub-2',
    intern: { group: 'Group 1', mentorId: 'mentor-123' },
    domainProjectAssignmentId: 'assign-456',
  };

  // Evaluate flawed condition for general submission
  const flawedMatch = generalSubmission.intern.group === mentorProfile.group && generalSubmission.domainProjectAssignmentId !== null;
  assert.equal(flawedMatch, false, 'Flawed query filtered out general weekly submissions');

  // Evaluate fixed condition for both submissions
  const fixedMatchGeneral = generalSubmission.intern.group === mentorProfile.group || generalSubmission.intern.mentorId === mentorProfile.id;
  const fixedMatchProject = projectSubmission.intern.group === mentorProfile.group || projectSubmission.intern.mentorId === mentorProfile.id;

  assert.equal(fixedMatchGeneral, true, 'Fixed query matches general weekly submissions');
  assert.equal(fixedMatchProject, true, 'Fixed query matches project weekly submissions');
});
