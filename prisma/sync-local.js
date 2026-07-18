const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function normalizeInternshipDomain(rawDomain) {
  if (!rawDomain) return 'Web Development';
  const clean = rawDomain.trim().toLowerCase();

  if (clean === 'ai' || clean.includes('artificial intelligence')) {
    return 'Artificial Intelligence';
  }
  if (clean.includes('machine learning') || clean.includes('machinelearning')) {
    return 'Machine Learning';
  }
  if (clean.includes('web development') || clean.includes('web') || clean === 'web dev') {
    return 'Web Development';
  }
  if (clean.includes('full stack') || clean.includes('fullstack')) {
    return 'Full Stack Development';
  }
  if (clean.includes('database') || clean.includes('db')) {
    return 'Database Development';
  }
  if (clean.includes('mobile') || clean.includes('app')) {
    return 'Mobile App Development';
  }
  if (clean.includes('testing') || clean.includes('qa') || clean.includes('quality')) {
    return 'Testing & QA';
  }
  return 'Web Development';
}

async function main() {
  console.log("Starting local Excel matching and database sync...");

  // Load interns_data.json lookup map if it exists
  const jsonPath = path.join(process.cwd(), 'prisma', 'interns_data.json');
  let jsonData = [];
  if (fs.existsSync(jsonPath)) {
    try {
      jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    } catch (err) {
      console.error('Failed to parse interns_data.json:', err);
    }
  }

  const jsonMap = new Map();
  jsonData.forEach((row) => {
    const email = row['Email ID']?.toString().trim().toLowerCase();
    if (email) {
      jsonMap.set(email, row);
    }
  });

  const filePath = path.join(process.cwd(), 'public', 'Manchester_Technologies_Consolidated_Groupwise_Final_Updated.xlsx');
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Excel file not found at: ${filePath}`);
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Loaded ${rawData.length} rows from Excel sheet.`);

  // Fetch all mentors to map group -> mentorId
  const mentors = await prisma.mentorProfile.findMany({});
  const mentorMap = new Map();
  mentors.forEach(m => {
    mentorMap.set(m.group.trim().toLowerCase(), m.id);
  });

  const defaultPasswordHash = await bcrypt.hash('123456', 10);
  
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rawData) {
    try {
      const rawEmail = row['Email ID']?.toString().trim();
      if (!rawEmail) {
        skipped++;
        continue;
      }

      const email = rawEmail.toLowerCase();
      const rawSNo = row['S.No']?.toString().trim();
      const name = row['Student Name']?.toString().trim();
      const group = row['Group']?.toString().trim() || 'Group 1';
      const course = row['Course']?.toString().trim() || '';
      const phoneNumber = row['Phone Number']?.toString().trim() || '';
      const applicationID = row['Application ID']?.toString().trim() || '';
      const collegeName = row['College Name']?.toString().trim() || '';
      const status = row['Status']?.toString().trim() || '';

      // Resolve domain, duration, and branch from interns_data.json lookup if available
      const jsonRow = jsonMap.get(email);
      const domainVal = jsonRow ? jsonRow['Domain'] : (row['Domain'] || row['Branch/Specialization']);
      const domain = normalizeInternshipDomain(domainVal);
      
      const duration = jsonRow ? jsonRow['Duration'] : (row['Duration'] || '45 Days');
      const branch = jsonRow ? (jsonRow['Branch / Specialization'] || jsonRow['Branch']) : (row['Branch/Specialization'] || 'General');

      const rollNo = parseInt(rawSNo, 10);
      if (isNaN(rollNo)) {
        skipped++;
        continue;
      }

      const mentorKey = group.trim().toLowerCase();
      const mentorId = mentorMap.get(mentorKey) || null;

      const existingUser = await prisma.user.findUnique({
        where: { email },
        include: { internProfile: true },
      });

      if (existingUser) {
        if (existingUser.role !== 'INTERN') {
          skipped++;
          continue;
        }

        const profile = existingUser.internProfile;
        if (!profile) {
          await prisma.internProfile.create({
            data: {
              userId: existingUser.id,
              rollNo,
              name,
              phoneNumber,
              domain,
              duration,
              branch,
              group,
              collegeName,
              course,
              applicationID,
              status,
              mentorId,
            },
          });
          updated++;
          continue;
        }

        const isModified =
          profile.name !== name ||
          profile.rollNo !== rollNo ||
          profile.phoneNumber !== phoneNumber ||
          profile.domain !== domain ||
          profile.duration !== duration ||
          profile.branch !== branch ||
          profile.group !== group ||
          profile.collegeName !== collegeName ||
          profile.course !== course ||
          profile.applicationID !== applicationID ||
          profile.status !== status ||
          profile.mentorId !== mentorId;

        if (isModified) {
          await prisma.internProfile.update({
            where: { id: profile.id },
            data: {
              name,
              rollNo,
              phoneNumber,
              domain,
              duration,
              branch,
              group,
              collegeName,
              course,
              applicationID,
              status,
              mentorId,
            },
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        await prisma.user.create({
          data: {
            email,
            password: defaultPasswordHash,
            role: 'INTERN',
            internProfile: {
              create: {
                rollNo,
                name,
                phoneNumber,
                domain,
                duration,
                branch,
                group,
                collegeName,
                course,
                applicationID,
                status,
                mentorId,
              },
            },
          },
        });
        created++;
      }
    } catch (err) {
      console.error(`Error syncing row ${row['Student Name']}:`, err.message);
    }
  }

  console.log(`Sync Completed successfully.`);
  console.log(`Created: ${created} | Updated: ${updated} | Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error("Local sync execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
