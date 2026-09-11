import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Saves a base64 encoded image to the local public/uploads/produce directory.
 * Returns the public URL path (e.g. /uploads/produce/1725..._lot.jpg).
 */
export async function saveProduceImage(base64Data: string, mimeType: string = 'image/jpeg'): Promise<string> {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'produce');
    await fs.promises.mkdir(uploadDir, { recursive: true });

    let cleanBase64 = base64Data;
    if (cleanBase64.includes(';base64,')) {
      cleanBase64 = cleanBase64.split(';base64,')[1];
    }

    const buffer = Buffer.from(cleanBase64, 'base64');
    let ext = 'jpg';
    if (mimeType.includes('png')) ext = 'png';
    else if (mimeType.includes('webp')) ext = 'webp';

    const filename = `lot_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    await fs.promises.writeFile(filePath, buffer);
    return `/uploads/produce/${filename}`;
  } catch (error) {
    console.error('Failed to save produce image to disk:', error);
    // If disk write fails, fallback to inline data URI so listing doesn't break
    if (base64Data.startsWith('data:')) {
      return base64Data;
    }
    return `data:${mimeType};base64,${base64Data}`;
  }
}
