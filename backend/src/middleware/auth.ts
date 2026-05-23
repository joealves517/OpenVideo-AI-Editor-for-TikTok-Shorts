import type { Request, Response, NextFunction } from 'express';
import { createOrUpdateUser } from '../services/firestore.js';

export interface AuthenticatedRequest extends Request {
  userId: string; // Google sub id
  userEmail: string;
  userName: string;
  userPicture: string;
  userCredits: number;
  userTier: 'free' | 'premium' | 'pro' | 'admin';
}

interface GoogleTokenInfo {
  email: string;
  name?: string;
  picture?: string;
  sub: string;
  email_verified: string;
  aud: string;
}

// Verify OAuth Token from Google
async function verifyGoogleToken(
  token: string
): Promise<GoogleTokenInfo | null> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${token}`
    );
    if (!res.ok) return null;

    const info = (await res.json()) as GoogleTokenInfo;
    if (info.email && String(info.email_verified) === 'true') {
      return info;
    }
    return null;
  } catch {
    return null;
  }
}

// Fetch Full Google Profile Info
async function getGoogleUserInfo(
  token: string
): Promise<{ name: string; picture: string } | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { name: string; picture: string };
    return data;
  } catch {
    return null;
  }
}

/**
 * requireAuth middleware to secure endpoints
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'missing_token' });
    return;
  }

  const token = authHeader.slice(7);
  const googleInfo = await verifyGoogleToken(token);

  if (!googleInfo) {
    console.error('[Auth] Google token verification failed');
    res.status(401).json({ error: 'invalid_token' });
    return;
  }

  try {
    const userInfo = await getGoogleUserInfo(token);
    const userEmail = googleInfo.email;
    const firestoreId = googleInfo.sub; // Google Sub ID

    // Automatically create or update user and append OpenVideo Copilot to apps list
    const userDocData = await createOrUpdateUser(
      firestoreId,
      {
        email: userEmail,
        displayName: userInfo?.name || userEmail.split('@')[0],
        picture: userInfo?.picture || '',
      },
      'OpenVideo Copilot'
    );

    // Attach user payload to request
    const authReq = req as AuthenticatedRequest;
    authReq.userId = firestoreId;
    authReq.userEmail = userEmail;
    authReq.userName = userDocData.displayName || userEmail.split('@')[0];
    authReq.userPicture = userDocData.picture || '';
    authReq.userCredits = userDocData.credits ?? 0;
    authReq.userTier = userDocData.tier || 'free';

    return next();
  } catch (error) {
    console.error('[Auth] Firestore query/registration failed:', error);
    res.status(500).json({ error: 'database_error' });
  }
}
