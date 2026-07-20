import { promises as fs } from 'fs';
import path from 'path';

/**
 * Converts a file buffer into a self-contained Base64 Data URL.
 * Guaranteed 100% fail-safe on Vercel with zero external third-party dependencies.
 * @param buffer  - The raw file buffer
 * @param fileName - The original file name
 * @param folder  - Upload folder tag
 * @returns Upload URL (Base64 Data URL) and public ID
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
  } else if (ext === 'png') {
    mimeType = 'image/png';
  } else if (ext === 'jpg' || ext === 'jpeg') {
    mimeType = 'image/jpeg';
  } else if (ext === 'webp') {
    mimeType = 'image/webp';
  } else if (ext === 'svg') {
    mimeType = 'image/svg+xml';
  }

  const base64 = buffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64}`;

  return { url: dataUrl, publicId: safeName };
}
