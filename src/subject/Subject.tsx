import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Material, Mesh } from "three";
import { CHAPTERS } from "../chapters/registry";
import { subjectStateAt } from "./sequence";
import { Phone } from "./Phone";
import { Screen } from "./Screen";
import { WATCH_D, WATCH_H, WATCH_R, WATCH_W } from "./dimensions";
import { TIER_SETTINGS } from "../lib/tier";
import { useTier } from "../canvas/QualityProvider";
import type { ProgressRef } from "../lib/progress";
import xbillScreen from "../chapters/xbill/xbill-screen.jpg";
import spadeScreen from "../chapters/shadyspade/spade-screen.jpg";

/** How far the translucent copies travel at full split / full separation. */
const SPLIT_GAP = 1.75;
const LAYER_GAP = 1.15;
const CARDS = 5;

function isMesh(o: unknown): o is Mesh {
  return (o as Mesh).isMesh === true;
}

/** Sets opacity across a subtree, switching transparency on only when needed. */
function setOpacity(root: Group | null, opacity: number): void {
  if (!root) return;
  const visible = opacity > 0.004;
  root.visible = visible;
  if (!visible) return;
  const fading = opacity < 0.999;
  root.traverse((child) => {
    if (!isMesh(child)) return;
    const materials: Material[] = Array.isArray(child.material)
      ? child.material
      : [child.material];
    for (const m of materials) {
      m.transparent = fading || m.transparent;
      m.opacity = opacity;
      m.depthWrite = !fading;
    }
  });
}

/**
 * The one object the whole site is about.
 *
 * It never unmounts and is never swapped. Chapters do not own scenes any
 * more -- they declare the state this subject is in, and moving between
 * chapters is an interpolation of that state. There is nothing to crossfade,
 * so there is nothing to ghost.
 *
 * Splitting and layering are expressed as translucent copies sliding out of
 * the body rather than as the body itself coming apart: a seam down the face
 * of a phone reads as a broken model, not as a bill being divided.
 */
export function Subject({ progress }: { progress: ProgressRef }) {
  const root = useRef<Group>(null);
  const ghosts = useRef<(Group | null)[]>([]);
  const watch = useRef<Group>(null);
  const cards = useRef<(Mesh | null)[]>([]);
  const screenA = useRef<Group>(null);
  const screenB = useRef<Group>(null);
  const { metalness } = TIER_SETTINGS[useTier()];

  useFrame(() => {
    const g = root.current;
    if (!g) return;
    const s = subjectStateAt(progress.current, CHAPTERS);

    g.position.set(0, s.positionY, s.positionZ);
    g.rotation.set(s.tiltX, s.rotationY, 0);
    g.scale.setScalar(s.scale);

    const copyOpacity = Math.min(1, s.splitX + s.layerY) * 0.55;
    for (let i = 0; i < 2; i++) {
      const ghost = ghosts.current[i];
      if (!ghost) continue;
      const side = i === 0 ? -1 : 1;
      ghost.position.set(
        side * SPLIT_GAP * s.splitX,
        side * LAYER_GAP * s.layerY,
        side * 0.35 * s.layerY,
      );
      setOpacity(ghost, copyOpacity);
    }

    setOpacity(screenA.current, s.screenOn * (1 - s.screenMix));
    setOpacity(screenB.current, s.screenOn * s.screenMix);

    const w = watch.current;
    if (w) {
      w.position.set(1.45, -0.3, 0.35);
      w.scale.setScalar(0.6 + 0.4 * s.companion);
      setOpacity(w, s.companion);
    }

    for (let i = 0; i < CARDS; i++) {
      const card = cards.current[i];
      if (!card) continue;
      const angle = (i - (CARDS - 1) / 2) * 0.26 * s.cards;
      card.rotation.z = angle;
      card.position.set(Math.sin(angle) * 1.5, -Math.abs(angle) * 0.5, 0);
      card.visible = s.cards > 0.02;
    }
  });

  return (
    <group ref={root}>
      {/* Translucent copies: the split and the exploded stack. */}
      {[0, 1].map((i) => (
        <group
          key={i}
          ref={(el) => {
            ghosts.current[i] = el;
          }}
          visible={false}
        >
          <Phone />
        </group>
      ))}

      <Phone>
        <group ref={screenA} visible={false}>
          <Screen url={xbillScreen} opacity={1} renderOrder={1} />
        </group>
        <group ref={screenB} visible={false}>
          <Screen url={spadeScreen} opacity={1} renderOrder={2} />
        </group>
      </Phone>

      <group ref={watch} visible={false}>
        <RoundedBox args={[WATCH_W, WATCH_H, WATCH_D]} radius={WATCH_R} smoothness={3}>
          <meshStandardMaterial
            color="#c8ccd6"
            metalness={Math.max(metalness, 0.5)}
            roughness={0.19}
            envMapIntensity={1.35}
          />
        </RoundedBox>
      </group>

      <group position={[-1.8, -0.2, 0.5]}>
        {Array.from({ length: CARDS }, (_, i) => (
          <mesh
            key={i}
            ref={(m) => {
              cards.current[i] = m;
            }}
            visible={false}
          >
            <boxGeometry args={[0.4, 0.58, 0.014]} />
            <meshStandardMaterial color="#dfe4ee" metalness={0.1} roughness={0.42} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
