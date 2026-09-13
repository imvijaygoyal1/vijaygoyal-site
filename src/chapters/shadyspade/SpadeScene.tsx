import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";
import type { ChapterSceneProps } from "../types";
import { localProgress } from "../../lib/progress";
import { spadePose } from "./pose";

const CARDS = 5;

const SURFACE = {
  color: "#9aa3b7",
  metalness: 0.25,
  roughness: 0.32,
  emissive: "#20263a",
  emissiveIntensity: 0.45,
} as const;

/**
 * The only beat that breaks the one-object rhythm: the camera retreats, a
 * Watch arrives beside the phone, and cards deal out to the other side.
 */
export function SpadeScene({ progress, range }: ChapterSceneProps) {
  const phone = useRef<Group>(null);
  const watch = useRef<Group>(null);
  const cards = useRef<(Mesh | null)[]>([]);

  useFrame(() => {
    const p = phone.current;
    const w = watch.current;
    if (!p || !w) return;
    const pose = spadePose(localProgress(progress.current, range), CARDS);

    p.rotation.y = pose.phoneRotationY;
    w.position.set(...pose.watchPosition);
    w.scale.setScalar(0.55 + 0.45 * pose.reveal);
    w.visible = pose.watchVisible;

    for (let i = 0; i < CARDS; i++) {
      const card = cards.current[i];
      if (!card) continue;
      const angle = pose.cardAngles[i] ?? 0;
      card.rotation.z = angle;
      // Fan out along an arc, away from both devices.
      card.position.x = Math.sin(angle) * 1.5;
      card.position.y = -Math.abs(angle) * 0.5;
      card.visible = pose.cardsVisible;
    }
  });

  return (
    <group position={[0, 0.95, 0]}>
      <group ref={phone}>
        <mesh>
          <boxGeometry args={[1.1, 2.2, 0.08]} />
          <meshStandardMaterial {...SURFACE} />
        </mesh>
      </group>

      <group ref={watch}>
        <mesh>
          <boxGeometry args={[0.62, 0.74, 0.18]} />
          <meshStandardMaterial {...SURFACE} />
        </mesh>
      </group>

      {/* Dealt to the left, into empty stage rather than over the devices. */}
      <group position={[-1.75, -0.15, 0.5]}>
        {Array.from({ length: CARDS }, (_, i) => (
          <mesh
            key={i}
            ref={(m) => {
              cards.current[i] = m;
            }}
          >
            <boxGeometry args={[0.4, 0.58, 0.014]} />
            <meshStandardMaterial
              color="#c9d0de"
              metalness={0.1}
              roughness={0.45}
              emissive="#222a3d"
              emissiveIntensity={0.35}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
