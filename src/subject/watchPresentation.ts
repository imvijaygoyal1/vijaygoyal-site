/**
 * The Watch is a visual companion, so it should be readable as soon as the
 * Shady Spade scene starts. The chapter state still controls its fade-out;
 * this floor prevents the first part of the chapter from looking empty.
 */
export function watchOpacity(companion: number, inShadySpade: boolean): number {
  if (!inShadySpade) return 0;
  return Math.min(1, Math.max(companion, 0.92));
}
