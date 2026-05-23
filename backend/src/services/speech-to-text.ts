/**
 * Speech-to-Text service — Google Cloud STT replacing Deepgram.
 *
 * Ported from: editor/src/lib/transcribe/index.ts + deepgram-to-combo.ts
 *
 * Key adaptation:
 * - Original uses Deepgram SDK with URL input → TranscriptObject output
 * - We use Google Cloud STT V1 with URL download → same TranscriptObject output
 * - The response schema (words, paragraphs, language, duration) is preserved exactly
 */
import speech from '@google-cloud/speech';
import { config } from '../config/index.js';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { nanoid } from 'nanoid';

const speechClient = new speech.SpeechClient({
  projectId: config.gcp.projectId,
});

// --- Types ported from editor/src/lib/transcribe/types.ts ---

export interface Word {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export interface Sentence {
  text: string;
  start: number;
  end: number;
}

export interface Paragraph {
  sentences: Sentence[];
  numWords: number;
  start: number;
  end: number;
}

export interface LanguageDetectionResultsEntry {
  language: string;
  languageName: string;
  confidence?: number;
}

export interface TranscriptObject {
  duration: number;
  results: {
    main: {
      language: LanguageDetectionResultsEntry;
      text: string;
      words: Word[];
      paragraphs: Paragraph[];
    };
  };
}

// --- Transcription options matching original interface ---

export interface TranscribeOptions {
  url: string;
  language?: string;
  model?: string;
  smartFormat?: boolean;
  paragraphs?: boolean;
}

/**
 * Download audio from URL to buffer
 */
async function downloadAudio(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download audio from ${url}: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Convert Google Speech duration object to seconds (matching Deepgram's float seconds format)
 */
function durationToSeconds(duration: any): number {
  if (!duration) return 0;
  const seconds = parseInt(duration.seconds || '0', 10);
  const nanos = parseInt(duration.nanos || '0', 10);
  return seconds + nanos / 1_000_000_000;
}

/**
 * Build paragraphs from words by grouping into sentences (~8-12 words each).
 * Mirrors the structure that deepgram-to-combo.ts produces.
 */
function buildParagraphs(words: Word[]): Paragraph[] {
  if (words.length === 0) return [];

  const paragraphs: Paragraph[] = [];
  const wordsPerSentence = 10;

  for (let i = 0; i < words.length; i += wordsPerSentence) {
    const chunk = words.slice(i, i + wordsPerSentence);
    const sentenceText = chunk.map((w) => w.word).join(' ');

    const sentence: Sentence = {
      text: sentenceText,
      start: chunk[0].start,
      end: chunk[chunk.length - 1].end,
    };

    paragraphs.push({
      sentences: [sentence],
      numWords: chunk.length,
      start: chunk[0].start,
      end: chunk[chunk.length - 1].end,
    });
  }

  return paragraphs;
}

/**
 * Detect language name from BCP-47 code.
 * Simple mapping for common languages.
 */
function getLanguageName(code: string): string {
  const map: Record<string, string> = {
    vi: 'Vietnamese',
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese',
    pt: 'Portuguese',
    ru: 'Russian',
    ar: 'Arabic',
    hi: 'Hindi',
    th: 'Thai',
    id: 'Indonesian',
  };
  const prefix = code.split('-')[0].toLowerCase();
  return map[prefix] || code;
}

/**
 * Detect audio encoding and sample rate from file headers
 */
function detectEncoding(buffer: Buffer): {
  encoding: string;
  sampleRateHertz?: number;
} {
  if (
    buffer.length > 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WAVE'
  ) {
    try {
      const sampleRate = buffer.readUInt32LE(24);
      return { encoding: 'LINEAR16', sampleRateHertz: sampleRate };
    } catch {
      return { encoding: 'LINEAR16', sampleRateHertz: 16000 };
    }
  }
  if (buffer.length > 4 && buffer.toString('ascii', 0, 4) === 'fLaC') {
    return { encoding: 'FLAC' };
  }
  if (buffer.length > 4 && buffer.toString('ascii', 0, 4) === 'OggS') {
    return { encoding: 'OGG_OPUS' };
  }
  return { encoding: 'MP3', sampleRateHertz: 16000 };
}

/**
 * Helper to extract and compress audio from video buffer using ffmpeg
 */
async function extractAudio(videoBuffer: Buffer): Promise<Buffer> {
  const tempDir = tmpdir();
  const inputPath = join(tempDir, `stt-input-${nanoid()}.tmp`);
  const outputPath = join(tempDir, `stt-output-${nanoid()}.mp3`);

  try {
    console.log(`[STT] Writing temp input file: ${inputPath}`);
    writeFileSync(inputPath, videoBuffer);

    console.log(`[STT] Running ffmpeg to extract and compress audio...`);
    // Convert to highly compressed 16kHz mono MP3
    execSync(
      `ffmpeg -y -i "${inputPath}" -vn -acodec libmp3lame -ac 1 -ar 16000 -ab 32k "${outputPath}" 2>/dev/null`
    );

    console.log(`[STT] Reading compressed audio: ${outputPath}`);
    const audioBuffer = readFileSync(outputPath);
    console.log(`[STT] Compressed audio size: ${audioBuffer.length} bytes`);

    return audioBuffer;
  } catch (error) {
    console.warn(
      `[STT] ffmpeg extraction failed, falling back to original buffer:`,
      error
    );
    return videoBuffer;
  } finally {
    // Clean up temp files
    try {
      unlinkSync(inputPath);
    } catch {}
    try {
      unlinkSync(outputPath);
    } catch {}
  }
}

/**
 * Transcribe audio from a URL using Google Cloud Speech-to-Text.
 *
 * This is the main function ported from the original Deepgram-based transcribe().
 * It preserves the same input options and returns the same TranscriptObject shape.
 */
export async function transcribe(
  options: TranscribeOptions
): Promise<Partial<TranscriptObject> | null> {
  const { url, language, model } = options;

  if (!url) {
    throw new Error('Audio URL is required');
  }

  console.log(`[STT] Downloading audio from: ${url}`);
  let audioBuffer = await downloadAudio(url);
  console.log(`[STT] Audio downloaded: ${audioBuffer.length} bytes`);

  // Compress/extract audio if it's large (most likely a video file or raw high-def audio)
  if (audioBuffer.length > 200000) {
    audioBuffer = await extractAudio(audioBuffer);
  }

  // Determine language code (default auto-detect via multi-language)
  const languageCode = language && language !== 'auto' ? language : 'en-US';

  const audioConfig = detectEncoding(audioBuffer);

  const request = {
    audio: { content: audioBuffer.toString('base64') },
    config: {
      encoding: audioConfig.encoding as any,
      ...(audioConfig.sampleRateHertz
        ? { sampleRateHertz: audioConfig.sampleRateHertz }
        : {}),
      languageCode,
      enableWordTimeOffsets: true,
      enableAutomaticPunctuation: true,
      // Enable language detection if no language specified
      ...((!language || language === 'auto') && {
        alternativeLanguageCodes: [
          'vi-VN',
          'en-US',
          'es-ES',
          'fr-FR',
          'de-DE',
          'ja-JP',
          'ko-KR',
          'zh-CN',
          'pt-BR',
        ],
      }),
    },
  };

  console.log(`[STT] Transcribing with language: ${languageCode}`);
  const [response] = await speechClient.recognize(request);

  if (!response.results || response.results.length === 0) {
    return null;
  }

  // Extract words in Deepgram-compatible format (seconds, not milliseconds)
  const words: Word[] = [];
  let fullText = '';

  for (const result of response.results) {
    const alternative = result.alternatives?.[0];
    if (!alternative) continue;

    const segmentText = alternative.transcript || '';
    fullText += (fullText ? ' ' : '') + segmentText;

    if (alternative.words) {
      for (const wordInfo of alternative.words) {
        words.push({
          word: wordInfo.word || '',
          start: durationToSeconds(wordInfo.startTime),
          end: durationToSeconds(wordInfo.endTime),
          confidence: wordInfo.confidence || 0,
        });
      }
    }
  }

  if (!fullText) {
    return null;
  }

  // Build paragraphs from words (mimicking Deepgram paragraph output)
  const paragraphs = buildParagraphs(words);

  // Calculate duration from the last word's end time
  const duration = words.length > 0 ? words[words.length - 1].end : 0;

  // Detected language
  const detectedLang = response.results[0]?.languageCode || languageCode;
  const languageEntry: LanguageDetectionResultsEntry = {
    language: detectedLang,
    languageName: getLanguageName(detectedLang),
    confidence: 1.0,
  };

  console.log(
    `[STT] Transcription succeeded. ${words.length} words, ${duration.toFixed(2)}s`
  );

  return {
    duration,
    results: {
      main: {
        language: languageEntry,
        text: fullText,
        words,
        paragraphs,
      },
    },
  };
}
