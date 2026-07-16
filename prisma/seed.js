const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Load environment variables for local execution if not already loaded
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting seeding...");

  // Seed Admin
  const adminEmail = "manchestertechnologiess@gmail.com";
  const adminPassword = "Bery0218";
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password: hashedAdminPassword,
      role: "ADMIN"
    },
    create: {
      email: adminEmail,
      password: hashedAdminPassword,
      role: "ADMIN",
      adminProfile: {
        create: {}
      }
    }
  });

  console.log("Admin seeded:", adminUser.email);

  // Seed Mentors
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
      }
    });
    console.log(`Mentor Seeded: ${m.name} (${m.email}) for ${m.group}`);
  }

  // Seed Mock Problem Statements for groups
  const problemStatements = [
    { title: "AI/ML Model Fine-Tuning Guidelines", group: "Group 1", uploadedBy: "Pallavi", fileUrl: "/uploads/problem_statement_g1.pdf" },
    { title: "Advanced Data Visualization Dashboard Project", group: "Group 2", uploadedBy: "Prateeksha", fileUrl: "/uploads/problem_statement_g2.pdf" },
    { title: "Full Stack Internship & Question Viewing Platform", group: "Group 3", uploadedBy: "Ramya", fileUrl: "/uploads/problem_statement_g3.pdf" }
  ];

  for (const ps of problemStatements) {
    const existing = await prisma.problemStatement.findFirst({
      where: {
        title: ps.title,
        group: ps.group
      }
    });

    if (!existing) {
      await prisma.problemStatement.create({
        data: {
          title: ps.title,
          group: ps.group,
          uploadedBy: ps.uploadedBy,
          fileUrl: ps.fileUrl
        }
      });
      console.log(`Problem Statement Seeded for ${ps.group}: "${ps.title}"`);
    }
  }

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
