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

export async function syncExcelData(): Promise<SyncResult> {
  const result: SyncResult = {
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const filename = process.env.EXCEL_FILE_PATH || 'Manchester_Technologies_Consolidated_Groupwise_Final_Updated.xlsx';
    let filePath = path.isAbsolute(filename) ? filename : path.join(process.cwd(), filename);

    // Fallback to public folder (especially for Vercel serverless bundles)
    if (!path.isAbsolute(filename) && !fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), 'public', filename);
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
    const mentorMap = new Map<string, string>(); // group name -> mentorProfile.id
    mentors.forEach(m => {
      // Normalize group names, e.g. "Group 1" -> "Group 1"
      mentorMap.set(m.group.trim().toLowerCase(), m.id);
    });

    // Default password hash
    const defaultPasswordHash = await bcrypt.hash('123456', 10);

    for (const row of rawData) {
      try {
        const email = row['Email ID']?.toString().trim();
        const rawSNo = row['S.No']?.toString().trim();
        const name = row['Student Name']?.toString().trim();
        const group = row['Group']?.toString().trim() || 'Group 1';
        const domain = row['Branch/Specialization']?.toString().trim() || 'General';
        const course = row['Course']?.toString().trim() || '';
        const phoneNumber = row['Phone Number']?.toString().trim() || '';
        const applicationID = row['Application ID']?.toString().trim() || '';
        const collegeName = row['College Name']?.toString().trim() || '';
        const status = row['Status']?.toString().trim() || '';

        if (!email) {
          result.errors.push(`Row with S.No ${rawSNo} lacks an Email ID. Skipped.`);
          result.skipped++;
          continue;
        }

        const rollNo = parseInt(rawSNo, 10);
        if (isNaN(rollNo)) {
          result.errors.push(`Row for ${email} has invalid S.No: ${rawSNo}. Skipped.`);
          result.skipped++;
          continue;
        }

        // Determine correct mentor ID for this group
        const mentorKey = group.trim().toLowerCase();
        const mentorId = mentorMap.get(mentorKey) || null;

        // Check if user already exists
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
            // Re-create profile if missing for some reason
            await prisma.internProfile.create({
              data: {
                userId: existingUser.id,
                rollNo,
                name,
                phoneNumber,
                domain,
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

          // Check if any fields are modified
          const isModified =
            profile.name !== name ||
            profile.rollNo !== rollNo ||
            profile.phoneNumber !== phoneNumber ||
            profile.domain !== domain ||
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
          // Create new user and intern profile
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
