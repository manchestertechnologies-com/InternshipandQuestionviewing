import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const partnerId = searchParams.get('partnerId');

  if (!partnerId) {
    return NextResponse.json({ error: 'Partner ID is required' }, { status: 400 });
  }

  try {
    const userId = session.user.id;

    // Get messages between current user and partner
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark incoming messages as read
    await prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userId,
        readStatus: false,
      },
      data: {
        readStatus: true,
      },
    });

    return NextResponse.json(messages);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { receiverId, content } = await request.json();

    if (!receiverId || !content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Receiver ID and content are required' }, { status: 400 });
    }

    const userId = session.user.id;

    const message = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId,
        content: content.trim(),
        readStatus: false,
      },
    });

    // Determine sender name for notification
    let senderName = 'Someone';
    if (session.user.role === 'MENTOR') {
      const mentor = await prisma.mentorProfile.findUnique({
        where: { userId },
      });
      if (mentor) senderName = mentor.name;
    } else if (session.user.role === 'INTERN') {
      const intern = await prisma.internProfile.findUnique({
        where: { userId },
      });
      if (intern) senderName = intern.name;
    }

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        content: `New message from ${senderName}: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
        type: 'MESSAGE',
      },
    });

    return NextResponse.json(message);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
