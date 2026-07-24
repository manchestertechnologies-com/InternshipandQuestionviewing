import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim().replace(/^["']|["']$/g, '');
const apiKey = process.env.CLOUDINARY_API_KEY?.trim().replace(/^["']|["']$/g, '');
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim().replace(/^["']|["']$/g, '');

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

/**
 * Uploads a file buffer.
 * Tries Cloudinary first (if configured and active); if Cloudinary fails (e.g. cloud_name disabled),
 * falls back to generating a self-contained Data URL for 100% reliable persistent file access on Vercel.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  fileName: string,
  folder: string
): Promise<{ url: string; publicId: string }> {
  const randomId = Math.random().toString(36).substring(2, 7);
  const safeName = `${Date.now()}_${randomId}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

  let mimeType = 'application/octet-stream';
  if (ext === 'pdf') {
    mimeType = 'application/pdf';
  } else if (ext === 'docx') {
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else if (ext === 'doc') {
    mimeType = 'application/msword';
  } else if (ext === 'zip') {
    mimeType = 'application/zip';
  } else if (ext === 'png') {
    mimeType = 'image/png';
  } else if (ext === 'jpg' || ext === 'jpeg') {
    mimeType = 'image/jpeg';
  } else if (ext === 'webp') {
    mimeType = 'image/webp';
  } else if (ext === 'svg') {
    mimeType = 'image/svg+xml';
  }

  // Try Cloudinary upload if config exists
  if (cloudName && apiKey && apiSecret) {
    try {
      const resourceType = (ext === 'pdf' || ext === 'docx' || ext === 'doc' || ext === 'zip') ? 'raw' : 'auto';
      const base64String = `data:${mimeType};base64,${buffer.toString('base64')}`;
      
      const uploadResult = await cloudinary.uploader.upload(base64String, {
        folder,
        public_id: safeName,
        resource_type: resourceType,
      });

      if (uploadResult && uploadResult.secure_url) {
        return { url: uploadResult.secure_url, publicId: uploadResult.public_id || safeName };
      }
    } catch (cloudinaryErr: any) {
      console.warn('Cloudinary server upload failed, falling back to persistent Data URL:', cloudinaryErr?.message || cloudinaryErr);
    }
  }

  // Fallback to Data URL
  const base64 = buffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64}`;

  return { url: dataUrl, publicId: safeName };
}
