/**
 * Text-To-Speech routes
 */
import { Router, type Request, type Response } from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js';
import {
  generateVoiceover,
  generateSoundEffect,
} from '../services/text-to-speech.js';
import {
  checkFreeCreditLimit,
  deductFreeCredits,
  deductCreditsByEmail,
  logUsage,
  getUserByEmail,
} from '../services/firestore.js';
import { calculateTTSCost } from '../services/token-cost.js';

const router = Router();

async function handleTTS(
  req: Request,
  res: Response,
  type: 'voiceover' | 'music' | 'sfx'
) {
  const authReq = req as AuthenticatedRequest;
  const { text, duration, voiceId = '21m00Tcm4TlvDq8ikWAM' } = req.body;

  if (!text) {
    res.status(400).json({ error: 'Text is required' });
    return;
  }

  try {
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

    let url = '';
    if (type === 'voiceover') {
      url = await generateVoiceover(text, voiceId);
    } else {
      url = await generateSoundEffect(text, duration);
    }

    // Deduct credits based on text length
    const creditsUsed = calculateTTSCost(text.length);

    if (isPremium) {
      await deductCreditsByEmail(authReq.userEmail, creditsUsed);
    } else {
      // Free users deduct fixed amount or proportional (e.g. 1 credit per generation)
      await deductFreeCredits(authReq.userEmail, 1);
    }

    await logUsage({
      userId: authReq.userId,
      app: 'OpenVideo Copilot',
      creditsUsed: isPremium ? creditsUsed : 1,
      model: `google-tts-${type}`,
      timestamp: new Date(),
      inputTokens: text.length,
    });

    res.json({ url });
  } catch (error: any) {
    console.error(`TTS generation error [${type}]:`, error);
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
}

/**
 * POST /api/elevenlabs/voiceover
 */
router.post('/voiceover', requireAuth, (req, res) =>
  handleTTS(req, res, 'voiceover')
);

/**
 * POST /api/elevenlabs/music
 */
router.post('/music', requireAuth, (req, res) => handleTTS(req, res, 'music'));

/**
 * POST /api/elevenlabs/sfx
 */
router.post('/sfx', requireAuth, (req, res) => handleTTS(req, res, 'sfx'));

export default router;
