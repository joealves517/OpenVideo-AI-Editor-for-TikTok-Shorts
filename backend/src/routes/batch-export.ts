/**
 * Batch Export route — ported from editor/src/app/api/batch-export/route.ts
 *
 * Original: Reads animation keys from local filesystem, saves exports to D:\animations
 * Adapted: Returns hardcoded animation keys from engine-pixi, saves exports to GCS
 *
 * Note: The GET endpoint in the original reads the engine-pixi source file at build time.
 * In Cloud Run, we don't have access to source files, so we hardcode the known keys.
 */
import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { uploadData } from '../services/gcs.js';

const router = Router();

// Animation preset keys extracted from packages/engine-pixi/src/animation/presets.ts
// These are the registered animation names in the original codebase
const ANIMATION_KEYS = [
  'fade-in',
  'fade-out',
  'slide-in-left',
  'slide-in-right',
  'slide-in-top',
  'slide-in-bottom',
  'slide-out-left',
  'slide-out-right',
  'slide-out-top',
  'slide-out-bottom',
  'zoom-in',
  'zoom-out',
  'bounce-in',
  'bounce-out',
  'rotate-in',
  'rotate-out',
  'flip-in',
  'flip-out',
  'blur-in',
  'blur-out',
];

// Default project template (same as editor/src/data/data.json structure)
const DEFAULT_TEMPLATE = {
  scenes: [],
  tracks: [],
};

/**
 * GET /api/batch-export — Get animation keys + project template
 * Ported from: editor/src/app/api/batch-export/route.ts GET handler
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      keys: ANIMATION_KEYS,
      template: DEFAULT_TEMPLATE,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/batch-export — Upload batch exported file
 * Ported from: editor/src/app/api/batch-export/route.ts POST handler
 *
 * Original saves to local filesystem (D:\animations).
 * We upload to GCS instead.
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    // Accept raw binary or base64-encoded data
    const { filename, data: base64Data } = req.body;

    if (!filename || !base64Data) {
      res
        .status(400)
        .json({ success: false, error: 'Missing file or filename' });
      return;
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = `animations/${filename}.mp4`;
    const publicUrl = await uploadData(filePath, buffer, 'video/mp4');

    res.json({
      success: true,
      path: publicUrl,
    });
  } catch (error: any) {
    console.error('Batch export error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
