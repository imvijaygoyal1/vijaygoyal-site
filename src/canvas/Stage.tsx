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
      <ambientLight intensity={0.35} />
      {lights > 0 && <directionalLight position={[3, 4, 5]} intensity={1.1} />}
      {lights > 2 && <pointLight position={[-4, -2, 3]} intensity={0.5} />}
    </>
  );
}

export function Stage({
  progress,
  onContextLost,
}: {
  progress: ProgressRef;
  onContextLost: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ position: "fixed", inset: 0 }}
      onCreated={({ gl }) => attachContextLossHandlers(gl.domElement, onContextLost)}
    >
      <QualityProvider>
        <Lights />
        <Environment resolution={64}>
          <Lightformer intensity={2} position={[0, 2, 4]} scale={[8, 8, 1]} />
          <Lightformer intensity={0.6} position={[-3, 1, 2]} scale={[4, 4, 1]} />
        </Environment>
        <CameraRig progress={progress} />
        <ScrollRig progress={progress} />
      </QualityProvider>
    </Canvas>
  );
}
