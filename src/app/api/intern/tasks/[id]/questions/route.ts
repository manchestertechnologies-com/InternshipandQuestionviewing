import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';

/**
 * If the imageUrl is a base64 data URL, upload it to Cloudinary and return the CDN URL.
 * Otherwise return the URL as-is (already a CDN URL from a previous save).
 */
async function persistImage(imageUrl: string, prefix: string): Promise<string> {
  if (!imageUrl.startsWith('data:image/')) return imageUrl;

  const matches = imageUrl.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
  if (!matches) return imageUrl;

  const ext = matches[1];
  const buffer = Buffer.from(matches[2], 'base64');
  const { url } = await uploadToCloudinary(buffer, `${prefix}.${ext}`, 'manchester-tech/question-images');
  return url;
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
      questionType,
      extraData,
      images, // Array of { imageUrl: string, type: string }
    } = body;

    // Upload any base64 images to Cloudinary
    const savedImages: { imageUrl: string; type: string }[] = [];
    if (images && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const cdnUrl = await persistImage(img.imageUrl, `q_${taskAssignmentId}_${i}`);
        savedImages.push({ imageUrl: cdnUrl, type: img.type });
      }
    }

    const question = await prisma.question.create({
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
        difficulty: 'Easy',
        status: 'PENDING',
        internId: intern.id,
        taskAssignmentId,
        questionType: questionType || 'MCQ',
        extraData: extraData || null,
        images: { create: savedImages },
      },
      include: { images: true },
    });

    return NextResponse.json(question);
  } catch (err: any) {
    console.error('Question create error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
