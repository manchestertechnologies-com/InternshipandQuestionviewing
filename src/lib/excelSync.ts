import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import prisma from './prisma';
import bcrypt from 'bcryptjs';

export interface SyncResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

function normalizeInternshipDomain(rawDomain: string | null | undefined): string {
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

export async function syncExcelData(): Promise<SyncResult> {
  const result: SyncResult = {
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // 1. Load interns_data.json lookup map if it exists
    const jsonPath = path.join(process.cwd(), 'prisma', 'interns_data.json');
    let jsonData: any[] = [];
    if (fs.existsSync(jsonPath)) {
      try {
        jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      } catch (err: any) {
        console.error('Failed to parse interns_data.json:', err);
      }
    }

    const jsonMap = new Map<string, any>();
    jsonData.forEach((row) => {
      const email = row['Email ID']?.toString().trim().toLowerCase();
      if (email) {
        jsonMap.set(email, row);
      }
    });

    const filename = process.env.EXCEL_FILE_PATH || 'Manchester_Technologies_Consolidated_Groupwise_Final_Updated.xlsx';
    let filePath = path.isAbsolute(filename) ? filename : path.join(process.cwd(), 'public', filename);

    if (!path.isAbsolute(filename) && !fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), filename);
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`Excel file not found at path: ${filePath}`);
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<any>(worksheet);

    result.total = rawData.length;

    // Fetch all mentors to map group -> mentorId
    const mentors = await prisma.mentorProfile.findMany({});
    const mentorMap = new Map<string, string>();
    mentors.forEach(m => {
      mentorMap.set(m.group.trim().toLowerCase(), m.id);
    });

    const defaultPasswordHash = await bcrypt.hash('123456', 10);

    for (const row of rawData) {
      try {
        const rawEmail = row['Email ID']?.toString().trim();
        if (!rawEmail) {
          result.errors.push(`Row with S.No ${row['S.No']} lacks an Email ID. Skipped.`);
          result.skipped++;
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
          result.errors.push(`Row for ${email} has invalid S.No: ${rawSNo}. Skipped.`);
          result.skipped++;
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
            result.errors.push(`User ${email} exists in the system but is not an Intern (role: ${existingUser.role}). Skipped.`);
            result.skipped++;
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
            result.updated++;
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
            result.updated++;
          } else {
            result.skipped++;
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
          result.created++;
        }
      } catch (err: any) {
        result.errors.push(`Error syncing row ${row['Student Name']} (${row['Email ID']}): ${err.message}`);
      }
    }
  } catch (err: any) {
    result.errors.push(`Global sync error: ${err.message}`);
  }

  return result;
}
