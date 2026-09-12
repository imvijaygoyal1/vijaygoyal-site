export type ScrollRange = readonly [number, number];

export function clamp01(n: number): number {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

export function localProgress(global: number, range: ScrollRange): number {
  const [start, end] = range;
  if (end <= start) {
    throw new RangeError(`Invalid scroll range [${start}, ${end}]: end must exceed start`);
  }
  return clamp01((global - start) / (end - start));
}

export function isActive(global: number, range: ScrollRange, margin = 0): boolean {
  const [start, end] = range;
  return global >= start - margin && global <= end + margin;
}
