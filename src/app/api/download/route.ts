import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

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
        if (!mentorProfile || submission.intern.group !== mentorProfile.group) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      fileUrl = submission.fileUrl;
      filename = submission.fileName || filename;
    }

    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL parameter is required' }, { status: 400 });
    }

    // Ensure filename has clean extension
    let mimeType = 'application/octet-stream';
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    if (ext === 'pdf') {
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

    // Handle Base64 Data URL
    if (fileUrl.startsWith('data:')) {
      const matches = fileUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return NextResponse.json({ error: 'Invalid data URL' }, { status: 400 });
      }

      const detectedMime = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      const headers = new Headers();
      headers.set('Content-Type', detectedMime || mimeType);
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      headers.set('Content-Length', buffer.length.toString());

      return new NextResponse(buffer, {
        status: 200,
        headers,
      });
    }

    // Handle Remote HTTP/HTTPS URL
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        return NextResponse.json({ error: `Failed to fetch file: ${response.statusText}` }, { status: response.status });
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const serverMime = response.headers.get('content-type') || mimeType;

      const headers = new Headers();
      headers.set('Content-Type', serverMime);
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
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
