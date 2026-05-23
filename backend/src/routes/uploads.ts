/**
 * Uploads route — ported from editor/src/app/api/uploads/presign/route.ts
 *
 * Original: Uses R2StorageService.createPresignedUpload()
 * Adapted: Uses GCS signed URLs with same interface
 */
import { Router, type Request, type Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { createPresignedUpload, generateFilePath } from '../services/gcs.js';

const router = Router();

/**
 * POST /api/uploads/presign — Generate presigned upload URLs
 * Ported from: editor/src/app/api/uploads/presign/route.ts
 *
 * Request body (identical to original):
 *   { userId?: string, fileNames: string[] }
 *
 * Response (identical to original):
 *   { success: true, uploads: [{ fileName, filePath, contentType, presignedUrl, url }] }
 */
router.post('/presign', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  try {
    const { fileNames } = req.body;

    if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
      res.status(400).json({
        error: 'fileNames array is required and must not be empty',
      });
      return;
    }

    const userId = authReq.userId;

    const uploads = await Promise.all(
      fileNames.map(async (originalName: string) => {
        const cleanName = originalName.trim();
        const filePath = generateFilePath(userId, cleanName);

        const presigned = await createPresignedUpload(filePath, {
          contentType: undefined,
          expiresIn: 3600,
        });

        return {
          fileName: cleanName,
          filePath: presigned.filePath,
          contentType: presigned.contentType,
          presignedUrl: presigned.presignedUrl,
          url: presigned.url,
        };
      })
    );

    res.json({ success: true, uploads });
  } catch (error) {
    console.error('Error in presign route:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
