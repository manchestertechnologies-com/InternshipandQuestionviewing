import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    console.log('Upload API received a request. File metadata:', {
      exists: !!file,
      type: file ? typeof file : 'undefined',
      isBlob: file instanceof Blob,
      name: file && (file as any).name,
      size: file && (file as any).size,
    });

    if (!file || typeof file === 'string' || !(file instanceof Blob)) {
      console.warn('Upload failed: No valid file uploaded or input type is incorrect.');
      return NextResponse.json({ error: 'No valid file uploaded' }, { status: 400 });
    }

    const fileObject = file as File;
    const arrayBuffer = await fileObject.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`Uploading file server-side: ${fileObject.name} (${buffer.length} bytes)`);
    
    // uploadToCloudinary will upload to Cloudinary (if configured) or fall back to local disk (if not)
    const { url: fileUrl } = await uploadToCloudinary(buffer, fileObject.name, 'manchester-tech/uploads');

    console.log('Upload completed successfully. File URL:', fileUrl);
    return NextResponse.json({ secure_url: fileUrl, url: fileUrl });
  } catch (err: any) {
    console.error('Upload failed with exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error during upload' }, { status: 500 });
  }
}
