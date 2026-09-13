import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { QualityProvider, useTier } from "./QualityProvider";
import { CameraRig } from "./CameraRig";
import { ScrollRig } from "./ScrollRig";
import { FrameProbe } from "./FrameProbe";
import { TIER_SETTINGS } from "../lib/tier";
import type { ProgressRef } from "../lib/progress";
import { attachContextLossHandlers } from "./useContextLoss";

function Lights() {
  const { lights } = TIER_SETTINGS[useTier()];
  return (
    <>
      {/* Ambient and the environment have to carry the low tier on their own:
          TIER_SETTINGS gives it zero dynamic lights. */}
      <ambientLight intensity={0.42} />
      {lights > 0 && <directionalLight position={[3, 4, 5]} intensity={2.1} />}
      {lights > 2 && <pointLight position={[-4, -2, 3]} intensity={0.8} />}
    </>
  );
}

/** Baked once, at a resolution the tier can afford. */
function BakedEnvironment() {
  const { envResolution: resolution } = TIER_SETTINGS[useTier()];
  return (
    <Environment frames={1} resolution={resolution}>
    {/* A key, a long soft fill, a cool rim, a ring specular and a warm
    bounce. Polished metal shows whatever the environment contains,
    so this is where most of the material's character comes from --
    a two-lamp environment is what made the bodies read as grey
    plastic. */}
    <Lightformer intensity={3.2} position={[0, 3, 5]} scale={[9, 9, 1]} />
    <Lightformer intensity={1.5} position={[-4, 1, 2]} scale={[6, 10, 1]} />
    <Lightformer intensity={2.4} color="#b9c8ff" position={[3, 1.5, -4]} scale={[6, 6, 1]} />
    <Lightformer form="ring" intensity={1.8} position={[-1.6, 2.4, 2.6]} scale={[2.4, 2.4, 1]} />
    <Lightformer intensity={1.2} color="#ffd9b0" position={[2.4, -1.6, 2]} scale={[3, 3, 1]} />
    </Environment>
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
        <BakedEnvironment />
        <FrameProbe />
        <CameraRig progress={progress} />
        <ScrollRig progress={progress} />
      </QualityProvider>
    </Canvas>
  );
}
