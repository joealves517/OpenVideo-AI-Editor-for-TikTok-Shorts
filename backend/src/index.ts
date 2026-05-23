import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { config } from './config/index.js';
import { db } from './config/db.js';

// Route imports — each maps 1:1 to an original Next.js API route
import chatRouter from './routes/chat.js';
import transcribeRouter from './routes/transcribe.js';
import elevenlabsRouter from './routes/elevenlabs.js';
import pexelsRouter from './routes/pexels.js';
import audioRouter from './routes/audio.js';
import projectsRouter from './routes/projects.js';
import customPresetsRouter from './routes/custom-presets.js';
import batchExportRouter from './routes/batch-export.js';
import uploadsRouter from './routes/uploads.js';
import userRouter from './routes/user.js';

dotenv.config();

const app = express();
const PORT = config.port;

// Safety Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Setup flexible CORS to support all local extensions dev origins and production extensions
const allowedOriginPattern = /^chrome-extension:\/\/.+$/;
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || origin === 'null') {
        return callback(null, true); // Allow server-to-server, tools, or sandboxed iframe calls
      }

      // Allow local development and Chrome Extension origins
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        allowedOriginPattern.test(origin)
      ) {
        return callback(null, true);
      }

      console.warn(`[CORS] Rejected origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    exposedHeaders: ['X-Credits-Deducted', 'X-Remaining-Credits'],
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health Check API
app.get('/health', async (req, res) => {
  try {
    const collections = await db.listCollections();
    res.json({
      status: 'healthy',
      database: 'connected',
      environment: config.nodeEnv,
      activeProject: config.gcp.projectId,
      collectionsCount: collections.length,
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
    });
  }
});

// --- Route Mounting (matching original Next.js API route paths) ---
// Original: editor/src/app/api/chat/editor  →  POST /api/chat/editor
app.use('/api/chat', chatRouter);
// Original: editor/src/app/api/transcribe   →  POST /api/transcribe
app.use('/api/transcribe', transcribeRouter);
// Original: editor/src/app/api/elevenlabs/* →  POST /api/elevenlabs/{voiceover,music,sfx}
app.use('/api/elevenlabs', elevenlabsRouter);
// Original: editor/src/app/api/pexels       →  GET  /api/pexels
app.use('/api/pexels', pexelsRouter);
// Original: editor/src/app/api/audio/*      →  POST /api/audio/{music,sfx}
app.use('/api/audio', audioRouter);
// Original: editor/src/app/api/projects     →  CRUD /api/projects
app.use('/api/projects', projectsRouter);
// Original: editor/src/app/api/custom-presets → GET/POST /api/custom-presets
app.use('/api/custom-presets', customPresetsRouter);
// Original: editor/src/app/api/batch-export → GET/POST /api/batch-export
app.use('/api/batch-export', batchExportRouter);
// Original: editor/src/app/api/uploads/presign → POST /api/uploads/presign
app.use('/api/uploads', uploadsRouter);

// Mount user route for getting profile and credits
app.use('/api/user', userRouter);

// Global Error Handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error('[Global Error]', err);
    res.status(err.status || 500).json({
      error: err.code || 'internal_server_error',
      message:
        config.nodeEnv === 'development'
          ? err.message
          : 'An unexpected error occurred.',
    });
  }
);

// Startup Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`  OpenVideo Copilot Backend Operational`);
  console.log(`  Port: ${PORT}`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Google Cloud Project: ${config.gcp.projectId}`);
  console.log(`  Routes: chat, transcribe, elevenlabs,`);
  console.log(`          pexels, audio, projects,`);
  console.log(`          custom-presets, batch-export,`);
  console.log(`          uploads`);
  console.log(`=========================================`);
});
