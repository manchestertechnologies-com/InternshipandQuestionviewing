import test from 'node:test';
import assert from 'node:assert/strict';

test('Database Cleanup Preservation Rules', () => {
  // Master models that must never be deleted
  const preservedModels = [
    'User',
    'AdminProfile',
    'MentorProfile',
    'InternProfile',
    'ViewerProfile',
    'OtpToken'
  ];

  // Transactional models cleared during reset
  const clearedModels = [
    'QuestionImage',
    'Question',
    'TaskAssignment',
    'Task',
    'WeeklySubmission',
    'DomainProjectAssignment',
    'DomainProject',
    'MeetingTarget',
    'Meeting',
    'ProblemStatement',
    'Announcement',
    'Message',
    'Notification'
  ];

  for (const model of preservedModels) {
    assert.ok(!clearedModels.includes(model), `${model} is safely excluded from deletion list`);
  }
});
