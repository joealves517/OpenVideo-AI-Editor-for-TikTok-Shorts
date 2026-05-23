/**
 * Projects route — ported from editor/src/app/api/projects/route.ts + [id]/route.ts
 *
 * Original: Prisma + PostgreSQL + BetterAuth session
 * Adapted: Firestore + Google OAuth token (via requireAuth middleware)
 * Same request/response schemas preserved.
 */
import { Router, type Request, type Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { db, Collections } from '../config/db.js';

const router = Router();

/**
 * GET /api/projects — List all projects for the authenticated user
 * Ported from: editor/src/app/api/projects/route.ts GET handler
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  try {
    const snapshot = await db
      .collection(Collections.PROJECTS)
      .where('userId', '==', authReq.userId)
      .orderBy('updatedAt', 'desc')
      .get();

    const projects = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * POST /api/projects — Create a new project
 * Ported from: editor/src/app/api/projects/route.ts POST handler
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  try {
    const body = req.body;
    const { id, name, thumbnail, canvasSize, canvasMode, fps, data } = body;

    if (!id || !name) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const projectData = {
      name,
      thumbnail: thumbnail || null,
      canvasSize: canvasSize || null,
      canvasMode: canvasMode || null,
      fps: fps || 30,
      data: data || null,
      userId: authReq.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Use client-provided ID as document ID (same as original Prisma behavior)
    await db.collection(Collections.PROJECTS).doc(id).set(projectData);

    res.json({ id, ...projectData });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * GET /api/projects/:id — Get a single project
 * Ported from: editor/src/app/api/projects/[id]/route.ts GET handler
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;

  try {
    const doc = await db.collection(Collections.PROJECTS).doc(id).get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const data = doc.data();
    // Ownership check (same as original Prisma where clause)
    if (data?.userId !== authReq.userId) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ id: doc.id, ...data });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * PATCH /api/projects/:id — Update project
 * Ported from: editor/src/app/api/projects/[id]/route.ts PATCH handler
 */
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;

  try {
    // Verify ownership first
    const docRef = db.collection(Collections.PROJECTS).doc(id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data()?.userId !== authReq.userId) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const body = req.body;
    const {
      name,
      thumbnail,
      canvasSize,
      canvasMode,
      fps,
      data,
      currentSceneId,
      bookmarks,
      mediaItems,
    } = body;

    // Build update object (only include defined fields, matching original Prisma update behavior)
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (canvasSize !== undefined) updateData.canvasSize = canvasSize;
    if (canvasMode !== undefined) updateData.canvasMode = canvasMode;
    if (fps !== undefined) updateData.fps = fps;
    if (data !== undefined) updateData.data = data;
    if (currentSceneId !== undefined)
      updateData.currentSceneId = currentSceneId;
    if (bookmarks !== undefined) updateData.bookmarks = bookmarks;
    if (mediaItems !== undefined) updateData.mediaItems = mediaItems;

    await docRef.update(updateData);

    const updated = await docRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * DELETE /api/projects/:id — Delete project
 * Ported from: editor/src/app/api/projects/[id]/route.ts DELETE handler
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { id } = req.params;

  try {
    const docRef = db.collection(Collections.PROJECTS).doc(id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data()?.userId !== authReq.userId) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    await docRef.delete();
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
