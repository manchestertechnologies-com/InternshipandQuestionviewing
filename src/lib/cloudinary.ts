import { v2 as cloudinary } from 'cloudinary';
import { promises as fs } from 'fs';
import path from 'path';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim().replace(/^["']|["']$/g, '');
const apiKey = process.env.CLOUDINARY_API_KEY?.trim().replace(/^["']|["']$/g, '');
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim().replace(/^["']|["']$/g, '');

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

/**
 * Uploads a file buffer to Cloudinary, falling back to local storage if disabled or fails.
 * @param buffer  - The raw file buffer
 * @param fileName - The original file name
 * @param folder  - Upload folder
 * @returns Upload URL and public ID / filename
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  fileName: string,
  folder: string
): Promise<{ url: string; publicId: string }> {
  // First, check if Cloudinary keys exist
  const isCloudinaryConfigured = cloudName && apiKey && apiSecret;

  if (isCloudinaryConfigured) {
    try {
      const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
      const resourceType: 'image' | 'raw' | 'auto' =
        ext === 'pdf' ? 'raw' : ext === 'docx' || ext === 'doc' ? 'raw' : 'auto';

      const result = await new Promise<{ url: string; publicId: string }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: resourceType,
            public_id: `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
            use_filename: false,
          },
          (error, result) => {
            if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
            resolve({ url: result.secure_url, publicId: result.public_id });
          }
        );
        uploadStream.end(buffer);
      });
      return result;
    } catch (err: any) {
      console.warn("Cloudinary upload failed, falling back to local storage:", err.message);
    }
  }

  // Local storage fallback
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });

    const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(uploadDir, safeName);
    
    await fs.writeFile(filePath, buffer);
    const localUrl = `/uploads/${safeName}`;
    return { url: localUrl, publicId: safeName };
  } catch (localErr: any) {
    console.error("Local storage fallback also failed:", localErr);
    throw localErr;
  }
}
