const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting Word document data sync...");

  const dataPath = path.join(__dirname, 'interns_data.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Extracted JSON data not found at ${dataPath}. Please run prisma/extract_all.py first.`);
  }

  const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  console.log(`Loaded ${rawData.length} records from JSON.`);

  // 1. Ensure Mentors exist and are seeded correctly
  const mentors = [
    {
      name: "Pallavi",
      email: "pallavids359@gmail.com",
      password: "Mentor2026",
      group: "Group 1"
    },
    {
      name: "Prateeksha",
      email: "dgprateeksha01@gmail.com",
      password: "Mentor2026",
      group: "Group 2"
    },
    {
      name: "Ramya",
      email: "r23616901@gmail.com",
      password: "Mentor2026",
      group: "Group 3"
    }
  ];

  const mentorMap = new Map();
  for (const m of mentors) {
    const hashedPwd = await bcrypt.hash(m.password, 10);
    const mentorUser = await prisma.user.upsert({
      where: { email: m.email },
      update: {
        password: hashedPwd,
        role: "MENTOR"
      },
      create: {
        email: m.email,
        password: hashedPwd,
        role: "MENTOR",
        mentorProfile: {
          create: {
            name: m.name,
            group: m.group
          }
        }
      },
      include: { mentorProfile: true }
    });
    
    if (mentorUser.mentorProfile) {
      mentorMap.set(m.group.toLowerCase().trim(), mentorUser.mentorProfile.id);
      console.log(`Mentor Ready: ${m.name} (${m.email}) -> ${mentorUser.mentorProfile.id}`);
    }
  }

  const defaultPasswordHash = await bcrypt.hash('123456', 10);
  const activeEmails = new Set();
  
  let createdCount = 0;
  let updatedCount = 0;

  for (const row of rawData) {
    const email = row['Email ID']?.toString().trim().toLowerCase();
    if (!email) continue;
    
    activeEmails.add(email);

    const name = row['Student Name']?.toString().trim();
    const phone = row['Phone Number']?.toString().trim();
    const domain = row['Domain']?.toString().trim();
    const duration = row['Duration']?.toString().trim();
    const course = row['Course']?.toString().trim();
    const branch = (row['Branch / Specialization'] || row['Branch'])?.toString().trim();
    const group = row['group']?.toString().trim();
    const rollNo = parseInt(row['S.No'], 10);

    const mentorId = mentorMap.get(group.toLowerCase().trim()) || null;

    // Check if User exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { internProfile: true }
    });

    if (existingUser) {
      // Ensure user role is INTERN
      if (existingUser.role !== 'INTERN') {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'INTERN' }
        });
      }

      if (existingUser.internProfile) {
        // Update profile
        await prisma.internProfile.update({
          where: { id: existingUser.internProfile.id },
          data: {
            rollNo,
            name,
            phoneNumber: phone,
            domain,
            duration,
            branch,
            group,
            course,
            mentorId,
            status: "Active" // Reset status to active
          }
        });
        updatedCount++;
      } else {
        // Create profile
        await prisma.internProfile.create({
          data: {
            userId: existingUser.id,
            rollNo,
            name,
            phoneNumber: phone,
            domain,
            duration,
            branch,
            group,
            course,
            mentorId,
            status: "Active"
          }
        });
        updatedCount++;
      }
    } else {
      // Create new User & InternProfile
      await prisma.user.create({
        data: {
          email,
          password: defaultPasswordHash,
          role: 'INTERN',
          internProfile: {
            create: {
              rollNo,
              name,
              phoneNumber: phone,
              domain,
              duration,
              branch,
              group,
              course,
              mentorId,
              status: "Active"
            }
          }
        }
      });
      createdCount++;
    }
  }

  // 2. Flag any existing interns who are not in the new authoritative Word docs
  const allDbInterns = await prisma.internProfile.findMany({
    include: { user: true }
  });

  let flaggedCount = 0;
  for (const intern of allDbInterns) {
    if (intern.user && intern.user.email) {
      const emailLower = intern.user.email.toLowerCase().trim();
      if (!activeEmails.has(emailLower) && intern.status !== 'FLAGGED_FOR_ADMIN_REVIEW') {
        await prisma.internProfile.update({
          where: { id: intern.id },
          data: { status: 'FLAGGED_FOR_ADMIN_REVIEW' }
        });
        console.log(`Flagged old intern: ${intern.name} (${intern.user.email})`);
        flaggedCount++;
      }
    }
  }

  console.log("Synchronization complete.");
  console.log(`Created: ${createdCount} | Updated: ${updatedCount} | Flagged old: ${flaggedCount}`);
}

main()
  .catch((e) => {
    console.error("Local sync execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
