import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

async function saveBase64Image(base64Data: string, prefix: string): Promise<string> {
  return base64Data;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id: taskAssignmentId } = await params;

  if (!session || session.user.role !== 'INTERN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const intern = await prisma.internProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!intern) {
      return NextResponse.json({ error: 'Intern profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      detailedSolution,
      subject,
      topic,
      subTopic,
      concept,
      subConcept,
      classVal,
      examType,
      images, // Array of { imageUrl: string, type: string }
    } = body;

    // Process and save images
    const savedImages = [];
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const savedUrl = await saveBase64Image(img.imageUrl, `img_${i}`);
        savedImages.push({
          imageUrl: savedUrl,
          type: img.type,
        });
      }
    }

    // Create question in database
    const question = await prisma.question.create({
      data: {
        questionText,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        detailedSolution,
        subject,
        topic,
        subTopic: subTopic || null,
        concept,
        subConcept: subConcept || null,
        classVal,
        examType,
        difficulty: 'Easy',
        status: 'PENDING',
        internId: intern.id,
        taskAssignmentId,
        images: {
          create: savedImages,
        },
      },
      include: {
        images: true,
      },
    });

    return NextResponse.json(question);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
