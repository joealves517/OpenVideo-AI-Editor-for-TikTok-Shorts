/**
 * Text-to-Speech service — Google Cloud TTS replacing ElevenLabs.
 *
 * Ported from: editor/src/app/api/elevenlabs/voiceover/route.ts
 *
 * Key adaptation:
 * - Original uses ElevenLabs API → uploads to R2 → returns { url }
 * - We use Google Cloud TTS → upload to GCS → return { url }
 * - Same response interface preserved for frontend compatibility
 */
import textToSpeech from '@google-cloud/text-to-speech';
import { config } from '../config/index.js';
import { uploadData } from './gcs.js';

const ttsClient = new textToSpeech.TextToSpeechClient({
  projectId: config.gcp.projectId,
});

interface GenerateTtsOptions {
  text: string;
  languageCode?: string;
  voiceName?: string;
  speakingRate?: number;
  pitch?: number;
}

/**
 * Voice ID mapping: ElevenLabs voice IDs → Google Cloud TTS voice names.
 * The original frontend sends ElevenLabs voiceId strings. We map to Google equivalents.
 */
const VOICE_MAP: Record<string, string> = {
  '21m00Tcm4TlvDq8ikWAM': 'en-US-Neural2-F', // Rachel (default ElevenLabs voice)
  EXAVITQu4vr4xnSDxMaL: 'en-US-Neural2-D', // Bella
  MF3mGyEYCl7XYWbV9V6O: 'en-US-Neural2-A', // Elli
  TxGEqnHWrfWFTfGW9XjX: 'en-US-Neural2-J', // Josh
  VR6AewLTigWG4xSOukaG: 'en-US-Neural2-C', // Arnold
};

/**
 * Resolve a voice name from an ElevenLabs voiceId or direct Google voice name.
 */
function resolveVoiceName(
  voiceIdOrName?: string,
  languageCode?: string
): string {
  if (!voiceIdOrName) {
    // Default high-quality voice based on language
    if (languageCode?.startsWith('vi')) return 'vi-VN-Wavenet-A';
    if (languageCode?.startsWith('en')) return 'en-US-Neural2-F';
    return `${languageCode || 'en-US'}-Standard-A`;
  }

  // Check if it's a known ElevenLabs ID
  const mapped = VOICE_MAP[voiceIdOrName];
  if (mapped) return mapped;

  // Assume it's already a Google TTS voice name
  return voiceIdOrName;
}

/**
 * Infer SSML gender from voice name for stable synthesis.
 */
function inferGender(voiceName: string): 'MALE' | 'FEMALE' | 'NEUTRAL' {
  if (/-[BD]$/.test(voiceName)) return 'MALE';
  if (/-[ACF]$/.test(voiceName)) return 'FEMALE';
  return 'NEUTRAL';
}

/**
 * Generate speech from text and upload to GCS.
 * Returns a public URL — same as the original ElevenLabs + R2 flow.
 */
export async function generateVoiceover(
  text: string,
  voiceId?: string,
  languageCode?: string
): Promise<string> {
  const resolvedLanguage = languageCode || 'en-US';
  const voiceName = resolveVoiceName(voiceId, resolvedLanguage);
  const ssmlGender = inferGender(voiceName);

  console.log(
    `[TTS] Generating voiceover: voice=${voiceName}, lang=${resolvedLanguage}, text_len=${text.length}`
  );

  const [response] = await ttsClient.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: resolvedLanguage,
      name: voiceName,
      ssmlGender,
    },
    audioConfig: {
      audioEncoding: 'MP3' as const,
      speakingRate: 1.0,
      pitch: 0.0,
    },
  });

  if (!response.audioContent) {
    throw new Error('No audio content returned from Google Text-to-Speech');
  }

  const audioBuffer = Buffer.from(response.audioContent as Uint8Array);
  const fileName = `voiceovers/${Date.now()}.mp3`;
  const publicUrl = await uploadData(fileName, audioBuffer, 'audio/mpeg');

  console.log(
    `[TTS] Voiceover uploaded: ${publicUrl} (${audioBuffer.length} bytes)`
  );
  return publicUrl;
}

/**
 * Generate audio for music/sfx prompts.
 * Note: Google Cloud TTS doesn't have a sound generation API like ElevenLabs.
 * We use TTS as a creative workaround for narrated "music descriptions",
 * or return a silent placeholder. Future: integrate Vertex AI audio generation.
 */
export async function generateSoundEffect(
  text: string,
  durationSeconds?: number
): Promise<string> {
  // For now, generate a spoken version of the prompt description
  // In production, this could integrate with a music generation API
  console.log(
    `[TTS-SFX] Generating audio for prompt: "${text}", duration: ${durationSeconds}s`
  );

  const [response] = await ttsClient.synthesizeSpeech({
    input: { text: `[Sound effect: ${text}]` },
    voice: {
      languageCode: 'en-US',
      name: 'en-US-Neural2-F',
      ssmlGender: 'FEMALE' as const,
    },
    audioConfig: {
      audioEncoding: 'MP3' as const,
      speakingRate: 1.0,
    },
  });

  if (!response.audioContent) {
    throw new Error('Failed to generate sound effect audio');
  }

  const audioBuffer = Buffer.from(response.audioContent as Uint8Array);
  const category = text.toLowerCase().includes('music') ? 'music' : 'sfx';
  const fileName = `${category}/${Date.now()}.mp3`;
  const publicUrl = await uploadData(fileName, audioBuffer, 'audio/mpeg');

  return publicUrl;
}

/**
 * List available voices for a language — same as original ElevenLabs voices endpoint.
 */
export async function listAvailableVoices(languageCode: string = 'en-US') {
  const [response] = await ttsClient.listVoices({ languageCode });
  const voices = response.voices || [];

  return voices.map((v) => ({
    name: v.name,
    gender: v.ssmlGender,
    supportedLanguages: v.languageCodes,
    naturalSampleRateHertz: v.naturalSampleRateHertz,
  }));
}
