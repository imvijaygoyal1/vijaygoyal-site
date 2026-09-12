import { PerformanceMonitor } from "@react-three/drei";
import { createContext, useContext, useState, type ReactNode } from "react";
import { initialTier, nextTier, type Tier } from "../lib/tier";

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

  return (
    <PerformanceMonitor
      onIncline={() => setTier((t) => nextTier(t, "incline"))}
      onDecline={() => setTier((t) => nextTier(t, "decline"))}
    >
      <TierContext.Provider value={tier}>{children}</TierContext.Provider>
    </PerformanceMonitor>
  );
}
