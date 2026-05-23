/**
 * Custom Presets route — ported from editor/src/app/api/custom-presets/route.ts
 *
 * Original: Prisma + BetterAuth session
 * Adapted: Firestore + Google OAuth token
 * Same request/response schemas preserved.
 */
import { Router, type Request, type Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { db, Collections } from '../config/db.js';

const router = Router();

/**
 * GET /api/custom-presets — List presets (own + published from others)
 * Ported from: editor/src/app/api/custom-presets/route.ts GET handler
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  try {
    const category = req.query.category as string | undefined;

    // Fetch user's own presets
    let ownQuery = db
      .collection(Collections.CUSTOM_PRESETS)
      .where('userId', '==', authReq.userId);

    if (category) {
      ownQuery = ownQuery.where('category', '==', category);
    }

    const ownSnapshot = await ownQuery.orderBy('createdAt', 'desc').get();
    const ownPresets = ownSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Fetch published presets from other users
    let publishedQuery = db
      .collection(Collections.CUSTOM_PRESETS)
      .where('published', '==', true);

    if (category) {
      publishedQuery = publishedQuery.where('category', '==', category);
    }

    const publishedSnapshot = await publishedQuery
      .orderBy('createdAt', 'desc')
      .get();
    const publishedPresets = publishedSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }))
      .filter((preset) => preset.userId !== authReq.userId);

    res.json({ own: ownPresets, published: publishedPresets });
  } catch (error) {
    console.error('Error fetching presets:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/custom-presets — Create a new preset
 * Ported from: editor/src/app/api/custom-presets/route.ts POST handler
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  try {
    const body = req.body;
    const { name, category, data, published } = body;

    if (!name || !category || !data) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const presetData = {
      name,
      category,
      data,
      published: !!published,
      userId: authReq.userId,
      createdAt: new Date(),
    };

    const docRef = await db
      .collection(Collections.CUSTOM_PRESETS)
      .add(presetData);

    res.json({ id: docRef.id, ...presetData });
  } catch (error) {
    console.error('Error creating custom preset:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
