/**
 * Chat route — ported from editor/src/app/api/chat/editor/route.ts
 *
 * Original: export const POST = appRoute(chatFlow);
 * Adapted: Express route using Genkit flow runner with streaming response
 */
import { Router, type Request, type Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { chatFlow, scriptToVideoFlow } from '../services/genkit-ai.js';

const router = Router();

/**
 * POST /api/chat/editor — AI Chat with 16 agentic tools
 * Ported from: appRoute(chatFlow) in the original Next.js API
 */
router.post('/editor', requireAuth, async (req: Request, res: Response) => {
  try {
    const { message, history, metadata } = req.body;

    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    // Set SSE headers for streaming response (same as Genkit's appRoute does)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // Run the Genkit flow with streaming
    const { stream, output } = chatFlow.stream({ message, history, metadata });

    for await (const chunk of stream) {
      // Each chunk is a JSON string sent via sendChunk() in the flow
      res.write(`data: ${chunk}\n\n`);
    }

    // Send the final response
    const result = await output;
    res.write(
      `data: ${JSON.stringify({ event: 'done', reply: result.reply })}\n\n`
    );
    res.end();
  } catch (error) {
    console.error('[Chat] Error:', error);
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    // If headers already sent, just end the stream
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ event: 'error', message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ error: message });
    }
  }
});

/**
 * POST /api/chat/script-to-video — Script-to-Video flow
 * Ported from: editor/src/genkit/script-to-video-flow.ts
 */
router.post(
  '/script-to-video',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { message } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const { stream, output } = scriptToVideoFlow.stream({ message });

      for await (const chunk of stream) {
        res.write(`data: ${chunk}\n\n`);
      }

      const result = await output;
      res.write(
        `data: ${JSON.stringify({ event: 'done', reply: result.reply })}\n\n`
      );
      res.end();
    } catch (error) {
      console.error('[Script-to-Video] Error:', error);
      const msg =
        error instanceof Error ? error.message : 'Internal server error';
      if (res.headersSent) {
        res.write(
          `data: ${JSON.stringify({ event: 'error', message: msg })}\n\n`
        );
        res.end();
      } else {
        res.status(500).json({ error: msg });
      }
    }
  }
);

export default router;
