import dotenv from 'dotenv';

dotenv.config();

function loadConfig() {
  return {
    port: parseInt(process.env.PORT || '8080', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    gcp: {
      projectId: process.env.GCP_PROJECT_ID || 'ask-this-page',
      region: process.env.GCP_REGION || 'us-central1',
    },
    google: {
      oauthClientId:
        process.env.GOOGLE_OAUTH_CLIENT_ID ||
        '676582412453-75u6fhol5r48edp5a33j588esphgu594.apps.googleusercontent.com',
    },
    pexels: {
      apiKey: process.env.PEXELS_API_KEY || '',
    },
    gcs: {
      bucket: process.env.GCS_BUCKET || 'openvideo-copilot-media',
    },
  } as const;
}

export const config = loadConfig();
export type AppConfig = ReturnType<typeof loadConfig>;
