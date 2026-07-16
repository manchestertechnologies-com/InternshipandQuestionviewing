import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'MENTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
    }

    const announcements = await prisma.announcement.findMany({
      where: { mentorId: mentorProfile.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(announcements);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'MENTOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, content, domain } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        domain: domain === 'All' ? null : domain,
        group: mentorProfile.group,
        isFromAdmin: false,
        mentorId: mentorProfile.id,
      },
    });

    // Send notifications to interns who match the target domain and group
    const matchingInterns = await prisma.internProfile.findMany({
      where: {
        group: mentorProfile.group,
        domain: domain && domain !== 'All' ? domain : undefined,
      },
    });

    await Promise.all(
      matchingInterns.map((intern) =>
        prisma.notification.create({
          data: {
            userId: intern.userId,
            content: `New announcement: "${title}" by ${mentorProfile.name}`,
            type: 'ANNOUNCEMENT',
          },
        })
      )
    );

    return NextResponse.json(announcement);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
