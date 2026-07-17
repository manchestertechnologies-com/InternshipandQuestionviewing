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

  // Seed Mock Problem Statements for groups (Clear existing ones first to ensure new fields are populated)
  await prisma.problemStatement.deleteMany({});
  
  const problemStatements = [
    {
      title: "AI/ML Model Fine-Tuning Guidelines",
      group: "Group 1",
      uploadedBy: "Pallavi",
      fileUrl: "https://res.cloudinary.com/x5gin721/image/upload/v1/manchester-tech/seeds/problem_statement_g1.pdf",
      description: "Develop a robust pipeline to fine-tune deep learning models for classification tasks, focusing on hyperparameter tuning and model compression.",
      docUrl: "https://res.cloudinary.com/x5gin721/image/upload/v1/manchester-tech/seeds/documentation_g1.pdf",
      docName: "ML_Model_Finetuning_Guide.pdf",
      refUrl: "https://huggingface.co/docs/transformers/training",
      refName: "Hugging Face Fine-tuning Reference"
    },
    {
      title: "Advanced Data Visualization Dashboard Project",
      group: "Group 2",
      uploadedBy: "Prateeksha",
      fileUrl: "https://res.cloudinary.com/x5gin721/image/upload/v1/manchester-tech/seeds/problem_statement_g2.pdf",
      description: "Build an interactive, real-time analytics dashboard with React and Recharts to visualize student engagement metrics and leaderboard standings.",
      docUrl: "https://res.cloudinary.com/x5gin721/image/upload/v1/manchester-tech/seeds/documentation_g2.pdf",
      docName: "Dashboard_Design_Doc.pdf",
      refUrl: "https://recharts.org/en-US/guide",
      refName: "Recharts Library Docs"
    },
    {
      title: "Full Stack Internship & Question Viewing Platform",
      group: "Group 3",
      uploadedBy: "Ramya",
      fileUrl: "https://res.cloudinary.com/x5gin721/image/upload/v1/manchester-tech/seeds/problem_statement_g3.pdf",
      description: "Establish a complete portal to coordinate daily task worksheet submissions, NCERT question repositories, and student evaluation pipelines.",
      docUrl: "https://res.cloudinary.com/x5gin721/image/upload/v1/manchester-tech/seeds/documentation_g3.pdf",
      docName: "Platform_System_Architecture.pdf",
      refUrl: "https://nextjs.org/docs",
      refName: "Next.js App Router Documentation"
    }
  ];

  for (const ps of problemStatements) {
    await prisma.problemStatement.create({
      data: {
        title: ps.title,
        group: ps.group,
        uploadedBy: ps.uploadedBy,
        fileUrl: ps.fileUrl,
        description: ps.description,
        docUrl: ps.docUrl,
        docName: ps.docName,
        refUrl: ps.refUrl,
        refName: ps.refName
      }
    });
    console.log(`Problem Statement Seeded for ${ps.group}: "${ps.title}"`);
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
