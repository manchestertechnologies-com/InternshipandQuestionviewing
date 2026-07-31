/**
 * Clear Questions and Daily Tasks
 * ================================
 * Deletes:
 *   1. All Question records (QuestionImage auto-cascades)
 *   2. All TaskAssignment records
 *   3. All Task records
 *
 * Does NOT touch:
 *   Users, InternProfiles, MentorProfiles, Submissions,
 *   Messages, Projects, WeeklyReports, Announcements, Leaderboard
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting cleanup...\n');

  // Step 1: Delete all Questions (QuestionImage cascades automatically)
  const deletedQuestions = await prisma.question.deleteMany({});
  console.log(`✅ Deleted ${deletedQuestions.count} Question records (+ linked QuestionImage rows)`);

  // Step 2: Delete all TaskAssignments
  const deletedAssignments = await prisma.taskAssignment.deleteMany({});
  console.log(`✅ Deleted ${deletedAssignments.count} TaskAssignment records`);

  // Step 3: Delete all Tasks (the daily task definitions)
  const deletedTasks = await prisma.task.deleteMany({});
  console.log(`✅ Deleted ${deletedTasks.count} Task records`);

  console.log('\n✅ Done. Questions and daily tasks have been cleared.');
  console.log('   All users, profiles, and other data are untouched.');
}

main()
  .catch((e) => {
    console.error('❌ Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
