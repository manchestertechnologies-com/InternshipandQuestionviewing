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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; qId: string }> }
) {
  const session = await getServerSession(authOptions);
  const { qId } = await params;

  if (!session || session.user.role !== 'INTERN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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
      images,
    } = body;

    // Update base fields and reset status to PENDING
    await prisma.question.update({
      where: { id: qId },
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
        status: 'PENDING',
      },
    });

    // Update images if provided
    if (images) {
      await prisma.questionImage.deleteMany({
        where: { questionId: qId },
      });

      const savedImages = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const savedUrl = await saveBase64Image(img.imageUrl, `img_${i}`);
        savedImages.push({
          questionId: qId,
          imageUrl: savedUrl,
          type: img.type,
        });
      }

      if (savedImages.length > 0) {
        await prisma.questionImage.createMany({
          data: savedImages,
        });
      }
    }

    const updated = await prisma.question.findUnique({
      where: { id: qId },
      include: { images: true },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; qId: string }> }
) {
  const session = await getServerSession(authOptions);
  const { qId } = await params;

  if (!session || session.user.role !== 'INTERN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.question.delete({
      where: { id: qId },
    });

    return NextResponse.json({ success: true, message: 'Question deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
