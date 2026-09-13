export type Tier = "high" | "medium" | "low";

export interface TierSettings {
  dpr: number;
  shadows: "soft" | "baked";
  post: "full" | "aa" | "none";
  lights: number;
  lod: 0 | 1;
  screen: "video" | "still";
  /** Corner subdivision on device bodies. The single biggest geometry lever. */
  smoothness: number;
  /** Cubemap resolution for the baked environment. */
  envResolution: number;
  /** How reflective the bodies are. Env-mapped metal is the most expensive
   *  per-pixel material in the scene, so a weak device gets a plainer one. */
  metalness: number;
}

export const TIER_SETTINGS: Record<Tier, TierSettings> = {
  high:   { dpr: 2,   shadows: "soft",  post: "full", lights: 3, lod: 0, screen: "video", smoothness: 4, envResolution: 128, metalness: 0.45 },
  medium: { dpr: 1.5, shadows: "baked", post: "aa",   lights: 1, lod: 1, screen: "video", smoothness: 2, envResolution: 64,  metalness: 0.3 },
  low:    { dpr: 1,   shadows: "baked", post: "none", lights: 0, lod: 1, screen: "still", smoothness: 1, envResolution: 32,  metalness: 0.12 },
};

const ORDER: readonly Tier[] = ["low", "medium", "high"];

export function initialTier(dpr: number, cores: number): Tier {
  if (dpr < 1.5) return "low";
  if (cores >= 8) return "high";
  if (cores >= 4) return "medium";
  return "low";
}

export function nextTier(current: Tier, signal: "incline" | "decline"): Tier {
  const i = ORDER.indexOf(current);
  const target = signal === "incline" ? i + 1 : i - 1;
  return ORDER[Math.min(Math.max(target, 0), ORDER.length - 1)]!;
}
