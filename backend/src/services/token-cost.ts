/**
 * Token-based cost calculation for Google Cloud usage.
 *
 * Credit system:
 *   1 credit = $0.001 (0.1 cent)
 *   Budget per cycle: $3.99 → 3,990 credits
 */

const DOLLARS_PER_CREDIT = 0.001;

// STT: $0.024 per minute -> $0.0004 per second
// Cost to user: 30 credits per minute (0.5 credits per second)
const STT_CREDITS_PER_SECOND = 0.5;

// TTS: $0.000016 per char
// Cost to user: 0.05 credits per char
const TTS_CREDITS_PER_CHAR = 0.05;

/**
 * Calculate credit cost from TTS text length.
 * Returns minimum 1 credit.
 */
export function calculateTTSCost(textLength: number): number {
  const credits = textLength * TTS_CREDITS_PER_CHAR;
  return Math.max(1, Math.ceil(credits));
}

/**
 * Calculate credit cost from STT audio duration in seconds.
 * Returns minimum 1 credit.
 */
export function calculateSTTCost(durationSeconds: number): number {
  const credits = durationSeconds * STT_CREDITS_PER_SECOND;
  return Math.max(1, Math.ceil(credits));
}

/** Credits granted per subscription cycle ($3.99 budget) */
export const CREDITS_PER_CYCLE = 3990;
