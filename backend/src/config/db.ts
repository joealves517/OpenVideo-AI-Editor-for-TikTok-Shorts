import { Firestore } from '@google-cloud/firestore';
import dotenv from 'dotenv';

dotenv.config();

const projectId = process.env.GCP_PROJECT_ID || 'ask-this-page';

export const db = new Firestore({
  projectId,
  databaseId: '(default)',
});

export const Collections = {
  USERS: 'users',
  PROJECTS: 'projects',
  CUSTOM_PRESETS: 'custom_presets',
} as const;

// --- Document Type Definitions ---

export interface UserDocument {
  email: string;
  displayName: string;
  picture: string;
  credits: number;
  totalCreditsUsed: number;
  tier: 'free' | 'premium' | 'pro' | 'admin';
  lemonSqueezy?: {
    customerId: string | null;
    subscriptionId: string | null;
    subscriptionItemId: string | null;
    status: string | null;
    currentPeriodEnd: Date | null;
  };
  apps?: string[];
  freeCreditsUsedToday?: number;
  freeCreditsLastReset?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDocument {
  name: string;
  userId: string;
  thumbnail?: string;
  fps: number;
  canvasSize: { width: number; height: number };
  canvasMode?: string;
  currentSceneId?: string;
  bookmarks?: any;
  mediaItems?: any;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomPresetDocument {
  name: string;
  category: string;
  data: any;
  published: boolean;
  userId: string;
  createdAt: Date;
}
