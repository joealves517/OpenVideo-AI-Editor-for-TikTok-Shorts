import { Router, type Request, type Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { createOrUpdateUser } from '../services/firestore.js';

const router = Router();

/**
 * GET /api/user
 * Returns user profile, tier, and credits balance.
 * Creates user document in Firestore if it doesn't exist yet.
 */
router.get(
  '/',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;

    const user = await createOrUpdateUser(
      authReq.userId,
      {
        email: authReq.userEmail,
        displayName: authReq.userName,
        picture: authReq.userPicture,
      },
      'OpenVideo Copilot'
    );

    res.json({
      userId: authReq.userId,
      email: user.email,
      displayName: user.displayName,
      picture: user.picture,
      tier: user.tier,
      credits: user.credits,
      freeCreditsUsedToday: user.freeCreditsUsedToday || 0,
      maxFreeCredits: 25,
      subscription: {
        status: user.lemonSqueezy?.status,
        currentPeriodEnd: user.lemonSqueezy?.currentPeriodEnd,
      },
    });
  }
);

export default router;
