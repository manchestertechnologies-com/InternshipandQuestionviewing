import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let fileUrl = searchParams.get('url');
    let filename = searchParams.get('filename') || 'download';
    const submissionId = searchParams.get('submissionId');
    const isInline = searchParams.get('inline') === 'true';

    // If submissionId is provided, lookup in database and check authorization
    if (submissionId) {
      const submission = await prisma.weeklySubmission.findUnique({
        where: { id: submissionId },
        include: {
          intern: true,
        },
      });

      if (!submission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }

      // Authorization check
      if (session.user.role === 'INTERN') {
        const internProfile = await prisma.internProfile.findUnique({
          where: { userId: session.user.id },
        });
        if (!internProfile || submission.internId !== internProfile.id) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      } else if (session.user.role === 'MENTOR') {
        const mentorProfile = await prisma.mentorProfile.findUnique({
          where: { userId: session.user.id },
        });
        if (
          !mentorProfile ||
          (submission.intern.group !== mentorProfile.group &&
            submission.intern.mentorId !== mentorProfile.id)
        ) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      fileUrl = submission.fileUrl;
      filename = submission.fileName || filename;
    }

    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL parameter is required' }, { status: 400 });
    }

    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const isPdf = ext === 'pdf' || fileUrl.toLowerCase().includes('.pdf') || filename.toLowerCase().includes('.pdf');

    // Ensure clean MIME type
    let mimeType = 'application/octet-stream';
    if (isPdf) {
      mimeType = 'application/pdf';
    } else if (ext === 'docx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (ext === 'doc') {
      mimeType = 'application/msword';
    } else if (ext === 'zip') {
      mimeType = 'application/zip';
    } else if (ext === 'png') {
      mimeType = 'image/png';
    } else if (ext === 'jpg' || ext === 'jpeg') {
      mimeType = 'image/jpeg';
    }

    const safeFilename = filename.replace(/["\r\n]/g, '_');
    const encodedFilename = encodeURIComponent(filename);
    const dispositionType = isInline ? 'inline' : 'attachment';
    const dispositionHeader = `${dispositionType}; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`;

    // 1. Handle Base64 Data URL
    if (fileUrl.startsWith('data:')) {
      const matches = fileUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return NextResponse.json({ error: 'Invalid data URL' }, { status: 400 });
      }

      const detectedMime = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      const headers = new Headers();
      headers.set('Content-Type', isPdf ? 'application/pdf' : (detectedMime || mimeType));
      headers.set('Content-Disposition', dispositionHeader);
      headers.set('Content-Length', buffer.length.toString());

      return new NextResponse(buffer, {
        status: 200,
        headers,
      });
    }

    // 2. Handle Local relative path (e.g. /uploads/...)
    if (fileUrl.startsWith('/') || !fileUrl.startsWith('http')) {
      const relativePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;
      const localFilePath = path.join(process.cwd(), 'public', relativePath);

      if (fs.existsSync(localFilePath)) {
        const fileBuffer = fs.readFileSync(localFilePath);
        const headers = new Headers();
        headers.set('Content-Type', isPdf ? 'application/pdf' : mimeType);
        headers.set('Content-Disposition', dispositionHeader);
        headers.set('Content-Length', fileBuffer.length.toString());
        return new NextResponse(fileBuffer, { status: 200, headers });
      }
    }

    // 3. Handle Remote HTTP/HTTPS URL
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      const response = await fetch(fileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        return NextResponse.json({ error: `Failed to fetch file: ${response.statusText}` }, { status: response.status });
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const serverMime = response.headers.get('content-type') || mimeType;

      const headers = new Headers();
      headers.set(
        'Content-Type',
        isPdf ? 'application/pdf' : (serverMime.includes('application/octet-stream') ? mimeType : serverMime)
      );
      headers.set('Content-Disposition', dispositionHeader);
      headers.set('Content-Length', buffer.length.toString());

      return new NextResponse(buffer, {
        status: 200,
        headers,
      });
    }

    return NextResponse.json({ error: 'Unsupported file URL format' }, { status: 400 });
  } catch (err: any) {
    console.error('Download error:', err);
    return NextResponse.json({ error: err.message || 'Download failed' }, { status: 500 });
  }
}
