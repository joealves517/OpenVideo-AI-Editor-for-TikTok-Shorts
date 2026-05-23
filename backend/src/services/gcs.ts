/**
 * Google Cloud Storage service
 * Replaces Cloudflare R2 from the original repo.
 * Provides the same interface: uploadData() returns a public URL, createPresignedUpload() returns signed URL.
 */
import { Storage } from '@google-cloud/storage';
import { config } from '../config/index.js';
import { nanoid } from 'nanoid';

const storage = new Storage({ projectId: config.gcp.projectId });
const bucket = storage.bucket(config.gcs.bucket);

/**
 * Upload binary data to GCS and return a public URL.
 * Mirrors the original R2StorageService.uploadData(path, buffer, contentType) interface.
 */
export async function uploadData(
  filePath: string,
  data: Buffer,
  contentType: string
): Promise<string> {
  const file = bucket.file(filePath);

  await file.save(data, {
    contentType,
    resumable: false,
    metadata: { cacheControl: 'public, max-age=31536000' },
  });

  // Public access is handled at bucket level via IAM (allUsers = objectViewer)
  return `https://storage.googleapis.com/${config.gcs.bucket}/${filePath}`;
}

/**
 * Create a presigned upload URL for client-side direct upload.
 * Mirrors the original R2StorageService.createPresignedUpload(path, options) interface.
 */
export async function createPresignedUpload(
  filePath: string,
  options?: { contentType?: string; expiresIn?: number }
): Promise<{
  filePath: string;
  contentType: string;
  presignedUrl: string;
  url: string;
}> {
  const file = bucket.file(filePath);
  const contentType = options?.contentType || 'application/octet-stream';
  const expiresIn = options?.expiresIn || 3600;

  const [presignedUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + expiresIn * 1000,
    contentType,
  });

  const publicUrl = `https://storage.googleapis.com/${config.gcs.bucket}/${filePath}`;

  return {
    filePath,
    contentType,
    presignedUrl,
    url: publicUrl,
  };
}

/**
 * Generate a unique file path with user namespace.
 */
export function generateFilePath(userId: string, originalName: string): string {
  return `${userId}/${nanoid()}-${originalName.trim()}`;
}
