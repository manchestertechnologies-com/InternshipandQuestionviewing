import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';

async function persistImage(imageUrl: string, prefix: string): Promise<string> {
  if (!imageUrl.startsWith('data:image/')) return imageUrl;

  const matches = imageUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
  if (!matches) return imageUrl;

  const ext = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const { url } = await uploadToCloudinary(buffer, `${prefix}.${ext}`, 'manchester-tech/question-images');
  return url;
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
      questionType,
      extraData,
      images,
    } = body;

    await prisma.question.update({
      where: { id: qId },
      data: {
        questionText,
        optionA: optionA || null,
        optionB: optionB || null,
        optionC: optionC || null,
        optionD: optionD || null,
        correctAnswer,
        detailedSolution,
        subject,
        topic,
        subTopic: subTopic || null,
        concept,
        subConcept: subConcept || null,
        classVal,
        examType,
        questionType: questionType || 'MCQ',
        extraData: extraData || null,
        status: 'PENDING',
      },
    });

    // Replace images with freshly persisted versions
    if (images) {
      await prisma.questionImage.deleteMany({ where: { questionId: qId } });

      const savedImages: { questionId: string; imageUrl: string; type: string }[] = [];
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const cdnUrl = await persistImage(img.imageUrl, `edit_${qId}_${i}`);
        savedImages.push({ questionId: qId, imageUrl: cdnUrl, type: img.type });
      }

      if (savedImages.length > 0) {
        await prisma.questionImage.createMany({ data: savedImages });
      }
    }

    const updated = await prisma.question.findUnique({
      where: { id: qId },
      include: { images: true },
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('Question update error:', err);
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
    await prisma.question.delete({ where: { id: qId } });
    return NextResponse.json({ success: true, message: 'Question deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
