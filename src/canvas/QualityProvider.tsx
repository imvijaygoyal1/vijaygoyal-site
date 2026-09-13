import { PerformanceMonitor } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { initialTier, nextTier, TIER_SETTINGS, type Tier } from "../lib/tier";

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

  return (
    <PerformanceMonitor
      onIncline={() => setTier((t) => nextTier(t, "incline"))}
      onDecline={() => setTier((t) => nextTier(t, "decline"))}
    >
      <TierContext.Provider value={tier}>{children}</TierContext.Provider>
    </PerformanceMonitor>
  );
}
