import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Use a safe filename with timestamp to prevent collisions
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
    const filePath = path.join(uploadDir, safeName);
    
    await fs.writeFile(filePath, buffer);
    const fileUrl = `/uploads/${safeName}`;

    return NextResponse.json({ secure_url: fileUrl, url: fileUrl });
  } catch (err: any) {
    console.error('Local upload error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
