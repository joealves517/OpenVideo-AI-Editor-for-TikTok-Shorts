/**
 * Audio search routes — ported from editor/src/app/api/audio/{music,sfx}/route.ts
 *
 * 100% identical logic: proxy pass-through to api-editor.cloud-45c.workers.dev
 */
import { Router, type Request, type Response } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/audio/music — Music search proxy
 * Ported from: editor/src/app/api/audio/music/route.ts
 */
router.post('/music', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const response = await fetch(
      'https://api-editor.cloud-45c.workers.dev/api/musics/search',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      res.status(response.status).json({
        error: (errorData as any).message || 'Failed to fetch music',
      });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Music API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/audio/sfx — SFX search proxy
 * Ported from: editor/src/app/api/audio/sfx/route.ts
 */
router.post('/sfx', requireAuth, async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const response = await fetch(
      'https://api-editor.cloud-45c.workers.dev/api/sound-effects/search',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      res.status(response.status).json({
        error: (errorData as any).message || 'Failed to fetch sound effects',
      });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('SFX API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
