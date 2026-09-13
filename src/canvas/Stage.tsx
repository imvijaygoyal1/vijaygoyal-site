import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { QualityProvider, useTier } from "./QualityProvider";
import { CameraRig } from "./CameraRig";
import { ScrollRig } from "./ScrollRig";
import { TIER_SETTINGS } from "../lib/tier";
import type { ProgressRef } from "../lib/progress";
import { attachContextLossHandlers } from "./useContextLoss";

function Lights() {
  const { lights } = TIER_SETTINGS[useTier()];
  return (
    <>
      {/* Ambient and the environment have to carry the low tier on their own:
          TIER_SETTINGS gives it zero dynamic lights. */}
      <ambientLight intensity={0.6} />
      {lights > 0 && <directionalLight position={[3, 4, 5]} intensity={2.4} />}
      {lights > 2 && <pointLight position={[-4, -2, 3]} intensity={0.9} />}
    </>
  );
}

export function Stage({
  progress,
  hidden = false,
  onContextLost,
  onContextRestored,
}: {
  progress: ProgressRef;
  /** True while a lost context is inside its restore window: kept in the
   *  document so `webglcontextrestored` can still fire, but invisible, inert,
   *  and not drawing frames. */
  hidden?: boolean;
  onContextLost: () => void;
  onContextRestored: () => void;
}) {
  return (
    <Canvas
      // Start at the conservative end of the budget table; QualityProvider
      // raises it once the tier is known and on every tier change after.
      dpr={1}
      frameloop={hidden ? "never" : "always"}
      aria-hidden={hidden || undefined}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{
        position: "fixed",
        inset: 0,
        visibility: hidden ? "hidden" : "visible",
        pointerEvents: hidden ? "none" : "auto",
      }}
      onCreated={({ gl }) =>
        attachContextLossHandlers(gl.domElement, onContextLost, onContextRestored)
      }
    >
      <QualityProvider>
        <Lights />
        <Environment resolution={64}>
          <Lightformer intensity={3.6} position={[0, 2, 4]} scale={[8, 8, 1]} />
          <Lightformer intensity={1.6} position={[-3, 1, 2]} scale={[4, 4, 1]} />
          {/* Rim from behind, so the slab keeps an edge against the stage even
              when it is turned away. */}
          <Lightformer intensity={2.2} position={[2, 1, -4]} scale={[5, 5, 1]} />
        </Environment>
        <CameraRig progress={progress} />
        <ScrollRig progress={progress} />
      </QualityProvider>
    </Canvas>
  );
}
