import { PerformanceMonitor } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { initialTier, nextTier, TIER_SETTINGS, type Tier } from "../lib/tier";

/** How long to let the scene settle before trusting a frame-rate dip. */
const WARMUP_MS = 2500;

const TierContext = createContext<Tier>("low");

export function useTier(): Tier {
  return useContext(TierContext);
}

export function QualityProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<Tier>(() =>
    initialTier(
      typeof window === "undefined" ? 1 : window.devicePixelRatio,
      typeof navigator === "undefined" ? 2 : (navigator.hardwareConcurrency ?? 2),
    ),
  );

  const setDpr = useThree((s) => s.setDpr);
  const currentDpr = useThree((s) => s.viewport.dpr);
  const targetDpr = TIER_SETTINGS[tier].dpr;

  // Device pixel ratio is the first row of the budget table and the biggest
  // single lever on mobile fill rate, so the tier has to actually reach it.
  // Reading `viewport.dpr` back makes this self-correcting: <Canvas> re-applies
  // its own `dpr` prop on every render, and that re-render lands us back here.
  useEffect(() => {
    if (currentDpr !== targetDpr) setDpr(targetDpr);
  }, [currentDpr, targetDpr, setDpr]);

  // Startup is the slowest the site will ever be: textures decode, the
  // environment bakes, the first frames are expensive. Acting on that dip
  // dropped the tier -- and therefore the device pixel ratio -- permanently,
  // leaving a retina display rendering soft for the whole session. Ignore
  // declines until the scene has settled, and require two in a row so a single
  // stutter cannot cost sharpness.
  const startedAt = useRef(performance.now());
  const declines = useRef(0);

  const onDecline = () => {
    if (performance.now() - startedAt.current < WARMUP_MS) return;
    declines.current += 1;
    if (declines.current < 2) return;
    declines.current = 0;
    setTier((t) => nextTier(t, "decline"));
  };

  const onIncline = () => {
    declines.current = 0;
    setTier((t) => nextTier(t, "incline"));
  };

  return (
    <PerformanceMonitor onIncline={onIncline} onDecline={onDecline}>
      <TierContext.Provider value={tier}>{children}</TierContext.Provider>
    </PerformanceMonitor>
  );
}
