/**
 * Transcribe route
 */
import { Router, type Request, type Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import { transcribe } from '../services/speech-to-text.js';
import {
  checkFreeCreditLimit,
  deductFreeCredits,
  deductCreditsByEmail,
  logUsage,
  getUserByEmail,
} from '../services/firestore.js';
import { calculateSTTCost } from '../services/token-cost.js';

const router = Router();

/**
 * POST /api/transcribe
 *
 * Request body (identical to original):
 *   { url: string, targetLanguage?: string, language?: string, model?: string }
 *
 * Response (identical to original TranscriptObject):
 *   { duration, results: { main: { language, text, words, paragraphs } } }
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  try {
    const body = req.body;
    const { url, targetLanguage, language, model } = body;

    if (!url) {
      res.status(400).json({ error: 'Audio URL is required' });
      return;
    }

    const user = await getUserByEmail(authReq.userEmail);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const userData = user.data;
    const isPremium = userData.credits > 0;

    if (!isPremium) {
      const canProceed = await checkFreeCreditLimit(authReq.userEmail);
      if (!canProceed) {
        res
          .status(402)
          .json({ error: 'Quota exhausted. Please upgrade to Pro.' });
        return;
      }
    }

    // Transcribe audio using Google Cloud STT
    const result = await transcribe({
      url,
      language: targetLanguage || language,
      model: model || 'default',
    });

    if (!result) {
      throw new Error('Transcription failed to return a result.');
    }

    const durationSeconds = result.duration || 1;
    const creditsUsed = calculateSTTCost(durationSeconds);

    if (isPremium) {
      await deductCreditsByEmail(authReq.userEmail, creditsUsed);
    } else {
      await deductFreeCredits(authReq.userEmail, 1);
    }

    await logUsage({
      userId: authReq.userId,
      app: 'OpenVideo Copilot',
      creditsUsed: isPremium ? creditsUsed : 1,
      model: 'google-stt',
      timestamp: new Date(),
      inputTokens: durationSeconds, // Storing duration as inputTokens for tracking
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Transcription error:', error);
    if (
      error.message?.includes('429') ||
      error.message?.includes('RESOURCE_EXHAUSTED')
    ) {
      res
        .status(429)
        .json({
          error: 'API rate limit reached. Please wait a moment and try again.',
        });
    } else {
      res
        .status(500)
        .json({
          error:
            'An error occurred while generating the response. Please try again.',
        });
    }
  }
});

export default router;
