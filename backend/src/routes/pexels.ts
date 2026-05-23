/**
 * Pexels route — ported from editor/src/app/api/pexels/route.ts
 *
 * 100% identical logic to original. Only NextResponse → Express res.json().
 */
import { Router, type Request, type Response } from 'express';
import { config } from '../config/index.js';

const router = Router();

/**
 * GET /api/pexels
 *
 * Query params (identical to original):
 *   type: 'image' | 'video' (default 'image')
 *   query: string (search term, optional — if omitted, returns curated/popular)
 *   page: string (default '1')
 *   per_page: string (default '20')
 *
 * Response: Pexels API response (pass-through)
 */
router.get('/', async (req: Request, res: Response) => {
  const PEXELS_API_KEY = config.pexels.apiKey;

  if (!PEXELS_API_KEY) {
    res.status(500).json({ error: 'PEXELS_API_KEY is not configured' });
    return;
  }

  const type = (req.query.type as string) || 'image';
  const query = req.query.query as string;
  const page = (req.query.page as string) || '1';
  const perPage = (req.query.per_page as string) || '20';

  let url = '';
  if (type === 'image') {
    url = query
      ? `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`
      : `https://api.pexels.com/v1/curated?page=${page}&per_page=${perPage}`;
  } else {
    url = query
      ? `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`
      : `https://api.pexels.com/videos/popular?page=${page}&per_page=${perPage}`;
  }

  try {
    const response = await fetch(url, {
      headers: { Authorization: PEXELS_API_KEY },
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { message?: string };
      res.status(response.status).json({
        error: errorData.message || 'Failed to fetch from Pexels',
      });
      return;
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Pexels API Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
