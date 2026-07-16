import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer to Cloudinary.
 * @param buffer  - The raw file buffer
 * @param fileName - The original file name (used for public_id and resource_type detection)
 * @param folder  - Cloudinary folder (e.g. 'tasks', 'submissions', 'question-images')
 * @returns Cloudinary secure_url
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  fileName: string,
  folder: string
): Promise<{ url: string; publicId: string }> {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

  // PDFs and DOCX are uploaded as 'raw' resource type
  const resourceType: 'image' | 'raw' | 'auto' =
    ext === 'pdf' ? 'raw' : ext === 'docx' || ext === 'doc' ? 'raw' : 'auto';

  return new Promise((resolve, reject) => {
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
}
