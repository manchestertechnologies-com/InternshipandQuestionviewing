import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const students = await prisma.internProfile.findMany({
      orderBy: { rollNo: 'asc' },
    });
    return NextResponse.json(students);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Intern ID is required' }, { status: 400 });
    }

    const intern = await prisma.internProfile.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!intern) {
      return NextResponse.json({ error: 'Intern not found' }, { status: 404 });
    }

    // Deleting the user will cascade to delete the InternProfile and all associated records (Submissions, TaskAssignments, etc.)
    await prisma.user.delete({
      where: { id: intern.userId },
    });

    return NextResponse.json({ success: true, message: 'Intern deleted successfully' });
  } catch (err: any) {
    console.error('Delete intern error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
