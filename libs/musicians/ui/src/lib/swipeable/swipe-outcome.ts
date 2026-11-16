export type SwipeDirection = 'like' | 'pass';

/** Minimum drag, in px, regardless of card width. */
export const MIN_SWIPE_PX = 80;
/** Fraction of the card width that commits a swipe. */
export const SWIPE_WIDTH_RATIO = 0.25;

/**
 * Decides what a drag of `dx` px on a card `width` px wide means: right is a
 * like, left is a pass, a short drag is nothing (the card snaps back).
 */
export function swipeOutcome(dx: number, width: number): SwipeDirection | null {
  const threshold = Math.max(MIN_SWIPE_PX, width * SWIPE_WIDTH_RATIO);
  if (dx >= threshold) return 'like';
  if (dx <= -threshold) return 'pass';
  return null;
}
