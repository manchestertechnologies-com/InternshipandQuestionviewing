const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Manually parse .env file
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (parts) {
      const key = parts[1];
      let value = parts[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }
      process.env[key] = value;
    }
  });
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting database cleanup...');

  try {
    // 1. Delete all transactional image assets
    const qiCount = await prisma.questionImage.deleteMany({});
    console.log(`Deleted ${qiCount.count} question images.`);

    // 2. Delete all questions entered by interns
    const qCount = await prisma.question.deleteMany({});
    console.log(`Deleted ${qCount.count} questions.`);

    // 3. Delete task assignments
    const taCount = await prisma.taskAssignment.deleteMany({});
    console.log(`Deleted ${taCount.count} task assignments.`);

    // 4. Delete tasks (assigned worksheets/files)
    const tCount = await prisma.task.deleteMany({});
    console.log(`Deleted ${tCount.count} daily tasks.`);

    // 5. Delete weekly submissions
    const wsCount = await prisma.weeklySubmission.deleteMany({});
    console.log(`Deleted ${wsCount.count} weekly submissions.`);

    // 6. Delete problem statements (major projects)
    const psCount = await prisma.problemStatement.deleteMany({});
    console.log(`Deleted ${psCount.count} domain projects / problem statements.`);

    // 7. Delete all communications
    const msgCount = await prisma.message.deleteMany({});
    console.log(`Deleted ${msgCount.count} chat messages.`);

    const notifCount = await prisma.notification.deleteMany({});
    console.log(`Deleted ${notifCount.count} notifications.`);

    const annCount = await prisma.announcement.deleteMany({});
    console.log(`Deleted ${annCount.count} announcements.`);

    // 8. Reset intern scores & progress back to initial state
    const resetInterns = await prisma.internProfile.updateMany({
      data: {
        totalPoints: 0,
        mentorScore: 0,
        progress: 0,
        rank: 0
      }
    });
    console.log(`Reset performance metrics for ${resetInterns.count} intern profiles.`);

    console.log('Database cleanup completed successfully!');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
