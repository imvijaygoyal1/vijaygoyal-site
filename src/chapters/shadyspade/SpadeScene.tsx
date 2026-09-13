import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Mesh } from "three";
import type { ChapterSceneProps } from "../types";
import { localProgress } from "../../lib/progress";
import { DeviceBody } from "../../canvas/DeviceBody";
import { ScreenPlane } from "../../canvas/ScreenPlane";
import { spadePose } from "./pose";
import screenUrl from "./spade-screen.jpg";

const CARDS = 5;

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
      card.position.x = Math.sin(angle) * 1.5;
      card.position.y = -Math.abs(angle) * 0.5;
      card.visible = pose.cardsVisible;
    }
  });

  return (
    <group position={[0, 0.95, 0]}>
      <group ref={phone}>
        <DeviceBody width={1.1} height={2.2} depth={0.09} radius={0.1}>
          {/* The real app, captured from the simulator. */}
          <ScreenPlane url={screenUrl} width={1.0} height={2.06} z={0.047} />
        </DeviceBody>
      </group>

      <group ref={watch}>
        <DeviceBody width={0.62} height={0.74} depth={0.2} radius={0.16} />
      </group>

      {/* Dealt to the left, into empty stage rather than over the devices. */}
      <group position={[-1.75, -0.15, 0.5]}>
        {Array.from({ length: CARDS }, (_, i) => (
          <DeviceBody
            key={i}
            ref={(m) => {
              cards.current[i] = m;
            }}
            width={0.4}
            height={0.58}
            depth={0.016}
            radius={0.035}
            color="#dfe4ee"
          />
        ))}
      </group>
    </group>
  );
}
