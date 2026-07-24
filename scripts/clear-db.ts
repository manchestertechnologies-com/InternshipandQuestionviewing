import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
  console.log('Starting database cleanup...');
  console.log('Preserving Users, InternProfiles, MentorProfiles, AdminProfiles, ViewerProfiles, and OtpTokens...\n');

  // Count existing users before cleanup
  const userCount = await prisma.user.count();
  const internCount = await prisma.internProfile.count();
  const mentorCount = await prisma.mentorProfile.count();
  const adminCount = await prisma.adminProfile.count();
  const viewerCount = await prisma.viewerProfile.count();

  console.log(`Pre-cleanup counts:`);
  console.log(`- Users: ${userCount}`);
  console.log(`- Intern Profiles: ${internCount}`);
  console.log(`- Mentor Profiles: ${mentorCount}`);
  console.log(`- Admin Profiles: ${adminCount}`);
  console.log(`- Viewer Profiles: ${viewerCount}\n`);

  // Delete transactional data in cascade order
  const qi = await prisma.questionImage.deleteMany({});
  console.log(`Deleted ${qi.count} QuestionImages`);

  const q = await prisma.question.deleteMany({});
  console.log(`Deleted ${q.count} Questions`);

  const ta = await prisma.taskAssignment.deleteMany({});
  console.log(`Deleted ${ta.count} TaskAssignments`);

  const t = await prisma.task.deleteMany({});
  console.log(`Deleted ${t.count} Tasks`);

  const ws = await prisma.weeklySubmission.deleteMany({});
  console.log(`Deleted ${ws.count} WeeklySubmissions`);

  const dpa = await prisma.domainProjectAssignment.deleteMany({});
  console.log(`Deleted ${dpa.count} DomainProjectAssignments`);

  const dp = await prisma.domainProject.deleteMany({});
  console.log(`Deleted ${dp.count} DomainProjects`);

  const mt = await prisma.meetingTarget.deleteMany({});
  console.log(`Deleted ${mt.count} MeetingTargets`);

  const m = await prisma.meeting.deleteMany({});
  console.log(`Deleted ${m.count} Meetings`);

  const ps = await prisma.problemStatement.deleteMany({});
  console.log(`Deleted ${ps.count} ProblemStatements`);

  const ann = await prisma.announcement.deleteMany({});
  console.log(`Deleted ${ann.count} Announcements`);

  const msg = await prisma.message.deleteMany({});
  console.log(`Deleted ${msg.count} Messages`);

  const notif = await prisma.notification.deleteMany({});
  console.log(`Deleted ${notif.count} Notifications`);

  // Reset Intern Profile performance metrics
  const resetInterns = await prisma.internProfile.updateMany({
    data: {
      totalPoints: 0,
      mentorScore: 0,
      progress: 0,
      rank: 0,
    },
  });
  console.log(`Reset performance metrics for ${resetInterns.count} InternProfiles`);

  // Verify users are preserved
  const postUserCount = await prisma.user.count();
  const postInternCount = await prisma.internProfile.count();

  console.log(`\nPost-cleanup verification:`);
  console.log(`- Users preserved: ${postUserCount} / ${userCount}`);
  console.log(`- Intern Profiles preserved: ${postInternCount} / ${internCount}`);

  if (userCount === postUserCount && internCount === postInternCount) {
    console.log('\nDatabase cleanup completed successfully with ALL user and student details intact!');
  } else {
    console.error('\nWARNING: User count mismatch detected!');
  }
}

main()
  .catch((e) => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
