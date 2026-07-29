import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
  console.log('--- QUESTIONS DATABASE CLEANUP ---');
  console.log('Deleting ONLY Questions, QuestionImages, TaskAssignments, and Tasks.');
  console.log('STRICTLY PRESERVING: DomainProjects, DomainProjectAssignments, WeeklySubmissions, Users, and Intern Profiles.\n');

  const preQuestions = await prisma.question.count();
  const preQuestionImages = await prisma.questionImage.count();
  const preTaskAssignments = await prisma.taskAssignment.count();
  const preTasks = await prisma.task.count();

  const preDomainProjects = await prisma.domainProject.count();
  const preDomainAssignments = await prisma.domainProjectAssignment.count();
  const preWeeklySubmissions = await prisma.weeklySubmission.count();
  const preUsers = await prisma.user.count();

  console.log(`Current Database Counts:`);
  console.log(`- Questions: ${preQuestions}`);
  console.log(`- Question Images: ${preQuestionImages}`);
  console.log(`- Question Tasks: ${preTasks}`);
  console.log(`- Task Assignments: ${preTaskAssignments}`);
  console.log(`- Domain Projects (PRESERVED): ${preDomainProjects}`);
  console.log(`- Domain Project Assignments (PRESERVED): ${preDomainAssignments}`);
  console.log(`- Weekly Submissions (PRESERVED): ${preWeeklySubmissions}`);
  console.log(`- Users (PRESERVED): ${preUsers}\n`);

  // Delete questions and question tasks only
  const qi = await prisma.questionImage.deleteMany({});
  console.log(`Deleted ${qi.count} QuestionImages`);

  const q = await prisma.question.deleteMany({});
  console.log(`Deleted ${q.count} Questions`);

  const ta = await prisma.taskAssignment.deleteMany({});
  console.log(`Deleted ${ta.count} TaskAssignments`);

  const t = await prisma.task.deleteMany({});
  console.log(`Deleted ${t.count} Tasks`);

  // Reset intern profile progress metrics for question tasks
  const resetInterns = await prisma.internProfile.updateMany({
    data: {
      totalPoints: 0,
      progress: 0,
    },
  });
  console.log(`Reset task progress for ${resetInterns.count} InternProfiles`);

  // Post-cleanup verification
  const postDomainProjects = await prisma.domainProject.count();
  const postDomainAssignments = await prisma.domainProjectAssignment.count();
  const postUsers = await prisma.user.count();

  console.log(`\n--- POST-CLEANUP VERIFICATION ---`);
  console.log(`- Remaining Questions: ${await prisma.question.count()}`);
  console.log(`- Preserved Domain Projects: ${postDomainProjects} / ${preDomainProjects}`);
  console.log(`- Preserved Domain Project Assignments: ${postDomainAssignments} / ${preDomainAssignments}`);
  console.log(`- Preserved Users: ${postUsers} / ${preUsers}`);

  if (postDomainProjects === preDomainProjects && postDomainAssignments === preDomainAssignments) {
    console.log('\nSUCCESS: Question database cleared successfully! All domain projects and intern project assignments were preserved.');
  } else {
    console.error('\nWARNING: Mismatch in preserved domain project counts!');
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
