import 'dotenv/config';
import prisma from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'prateeksha@gmail.com';
  const rawPassword = '123456';
  const name = 'Prateeksha';
  const domain = 'Web Development';
  const duration = '60 Days';
  const collegeName = 'GMIT';
  const course = 'CSE (4th Sem)';
  const group = 'Group 1';

  console.log(`Creating/updating test intern account: ${email}...`);

  const passwordHash = await bcrypt.hash(rawPassword, 10);

  // Find mentor for Group 1 if available
  const mentor = await prisma.mentorProfile.findFirst({
    where: { group: 'Group 1' },
  });

  // Get next available roll number
  const maxRoll = await prisma.internProfile.aggregate({
    _max: { rollNo: true },
  });
  const nextRollNo = (maxRoll._max.rollNo || 100) + 1;

  // Upsert User
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: passwordHash,
      role: 'INTERN',
    },
    create: {
      email,
      password: passwordHash,
      role: 'INTERN',
    },
  });

  // Upsert InternProfile
  const internProfile = await prisma.internProfile.upsert({
    where: { userId: user.id },
    update: {
      name,
      domain,
      duration,
      collegeName,
      course,
      group,
      mentorId: mentor ? mentor.id : null,
    },
    create: {
      userId: user.id,
      rollNo: nextRollNo,
      name,
      domain,
      duration,
      collegeName,
      course,
      group,
      mentorId: mentor ? mentor.id : null,
      status: 'Active',
      applicationID: 'APP-TEST-01',
    },
  });

  console.log(`\nTest Intern Account Ready!`);
  console.log(`-----------------------------`);
  console.log(`Email: ${user.email}`);
  console.log(`Password: ${rawPassword}`);
  console.log(`Role: ${user.role}`);
  console.log(`Name: ${internProfile.name}`);
  console.log(`Roll Number: #${internProfile.rollNo}`);
  console.log(`Domain: ${internProfile.domain}`);
  console.log(`Duration: ${internProfile.duration}`);
  console.log(`College: ${internProfile.collegeName}`);
  console.log(`Course: ${internProfile.course}`);
  console.log(`Group: ${internProfile.group}`);
  if (mentor) {
    console.log(`Mentor Assigned: ${mentor.name} (${mentor.group})`);
  }
}

main()
  .catch((e) => {
    console.error('Error creating test intern:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
