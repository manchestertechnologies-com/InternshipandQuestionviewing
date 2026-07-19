import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    console.log('Local upload API received a request. File metadata:', {
      exists: !!file,
      type: file ? typeof file : 'undefined',
      isBlob: file instanceof Blob,
      name: file && (file as any).name,
      size: file && (file as any).size,
    });

    if (!file || typeof file === 'string' || !(file instanceof Blob)) {
      console.warn('Local upload failed: No valid file uploaded or input type is incorrect.');
      return NextResponse.json({ error: 'No valid file uploaded' }, { status: 400 });
    }

    const fileObject = file as File;
    const arrayBuffer = await fileObject.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Use a safe filename with timestamp to prevent collisions
    const rawFileName = fileObject.name || 'uploaded_file';
    const safeName = `${Date.now()}_${rawFileName.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const filePath = path.join(uploadDir, safeName);
    
    console.log(`Writing file to local directory: ${filePath} (${buffer.length} bytes)`);
    await fs.writeFile(filePath, buffer);
    const fileUrl = `/uploads/${safeName}`;

    console.log('Local upload completed successfully. File URL:', fileUrl);
    return NextResponse.json({ secure_url: fileUrl, url: fileUrl });
  } catch (err: any) {
    console.error('Local upload failed with exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error during upload' }, { status: 500 });
  }
}
