import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';

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

    const tasks = await prisma.task.findMany({
      where: { mentorId: mentorProfile.id },
      include: {
        assignments: {
          include: { intern: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tasks);
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

    let title = '';
    let description = '';
    let deadlineDays = 23;
    let assigneeIdsRaw = '';
    let fileUrl: string | null = null;
    let fileName: string | null = null;

    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      title = body.title;
      description = body.description;
      deadlineDays = parseInt(body.deadlineDays, 10);
      assigneeIdsRaw = body.assigneeIds;
      fileUrl = body.fileUrl || null;
      fileName = body.fileName || null;
    } else {
      const formData = await request.formData();
      title = formData.get('title') as string;
      description = formData.get('description') as string;
      const deadlineDaysStr = formData.get('deadlineDays') as string;
      assigneeIdsRaw = formData.get('assigneeIds') as string;
      const file = formData.get('file') as File | null;

      if (!title || !description || !deadlineDaysStr || !assigneeIdsRaw) {
        return NextResponse.json(
          { error: 'Title, description, deadline, and assignees are required' },
          { status: 400 }
        );
      }

      deadlineDays = parseInt(deadlineDaysStr, 10);

      // Upload file to Cloudinary if provided
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const { url } = await uploadToCloudinary(buffer, file.name, 'manchester-tech/tasks');
        fileUrl = url;
        fileName = file.name;
      }
    }

    if (!title || !description || isNaN(deadlineDays)) {
      return NextResponse.json(
        { error: 'Invalid title, description or deadline cutoff' },
        { status: 400 }
      );
    }

    // Resolve assignees
    let assigneeIds: string[] = [];
    if (assigneeIdsRaw === 'ALL') {
      const groupInterns = await prisma.internProfile.findMany({
        where: { group: mentorProfile.group },
      });
      assigneeIds = groupInterns.map(i => i.id);
    } else {
      assigneeIds = assigneeIdsRaw.split(',').filter(id => id.length > 0);
    }

    if (assigneeIds.length === 0) {
      return NextResponse.json({ error: 'No interns selected for assignment' }, { status: 400 });
    }

    // Pre-fetch intern profiles outside the transaction to avoid multiple concurrent queries inside it
    const interns = await prisma.internProfile.findMany({
      where: { id: { in: assigneeIds } },
    });

    // Create task and assignments in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title,
          description,
          fileUrl,
          fileName,
          deadlineDays,
          mentorId: mentorProfile.id,
        },
      });

      const notificationData = assigneeIds.map((internId) => {
        const intern = interns.find(i => i.id === internId);
        return {
          userId: intern?.userId || '',
          content: "Your mentor has assigned a new Daily Task.",
          type: 'TASK_ASSIGNED',
        };
      }).filter(n => n.userId !== '');

      if (notificationData.length > 0) {
        await tx.notification.createMany({
          data: notificationData,
        });
      }

      const assignmentData = assigneeIds.map((internId) => ({
        taskId: task.id,
        internId,
        status: 'ASSIGNED',
      }));

      await tx.taskAssignment.createMany({
        data: assignmentData,
      });

      return { task };
    }, {
      timeout: 15000, // Extend interactive transaction timeout to 15s to handle high-latency connections
    });

    // Retrieve the created assignments to return in the response outside the transaction
    const assignments = await prisma.taskAssignment.findMany({
      where: { taskId: result.task.id },
      include: { intern: true },
    });

    return NextResponse.json({ task: result.task, assignments });
  } catch (err: any) {
    console.error('Task creation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
