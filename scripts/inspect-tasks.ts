import 'dotenv/config';
import prisma from '../src/lib/prisma';

async function main() {
  console.log('Inspecting Tasks in database...');
  const tasks = await prisma.task.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${tasks.length} tasks:`);
  for (const t of tasks) {
    console.log(`\nTask ID: ${t.id}`);
    console.log(`Title: ${t.title}`);
    console.log(`FileName: ${t.fileName}`);
    console.log(`FileUrl: ${t.fileUrl}`);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
