import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim().replace(/^["']|["']$/g, '');
const apiKey = process.env.CLOUDINARY_API_KEY?.trim().replace(/^["']|["']$/g, '');
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim().replace(/^["']|["']$/g, '');

// Ensure cloudinary config is loaded
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const folder = searchParams.get('folder') || 'manchester-tech';

  // Validate Cloudinary environment variables
  if (!cloudName || !apiKey || !apiSecret) {
    console.error('Cloudinary environment variables are missing on the server.');
    return NextResponse.json(
      { error: 'Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are not configured on the server. Please add them to your environment configuration.' },
      { status: 500 }
    );
  }

  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Cloudinary signature requires parameters to be signed
    const paramsToSign = {
      timestamp,
      folder,
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret
    );

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      apiKey,
      cloudName,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
