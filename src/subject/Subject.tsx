import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Material, Mesh } from "three";
import { CHAPTERS } from "../chapters/registry";
import { subjectStateAt } from "./sequence";
import { Phone } from "./Phone";
import { Screen } from "./Screen";
import { applyHomeZoom, HomeScreen } from "./HomeScreen";
import { facing } from "./facing";
import { WATCH_D, WATCH_H, WATCH_R, WATCH_W } from "./dimensions";
import { deviceGeometry } from "../canvas/deviceGeometry";
import { roundedRectGeometry } from "../canvas/roundedRect";
import { TIER_SETTINGS } from "../lib/tier";
import { useTier } from "../canvas/QualityProvider";
import type { ProgressRef } from "../lib/progress";
import xbillScreen from "../chapters/xbill/xbill-screen.jpg";
import spadeScreen from "../chapters/shadyspade/spade-screen.jpg";

/** How far the translucent copies travel at full split / full separation. */
const CARDS = 5;

function isMesh(o: unknown): o is Mesh {
  return (o as Mesh).isMesh === true;
}

/** Sets opacity across a subtree, switching transparency on only when needed. */
function setOpacity(root: Group | null | undefined, opacity: number): void {
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
  const watch = useRef<Group>(null);
  const cards = useRef<(Mesh | null)[]>([]);
  const home = useRef<Group>(null);
  const screenA = useRef<Group>(null);
  const screenB = useRef<Group>(null);
  const { metalness } = TIER_SETTINGS[useTier()];

  const watchBody = useMemo(
    () => deviceGeometry(WATCH_W, WATCH_H, WATCH_D, WATCH_R, 0.016),
    [],
  );
  const watchGlass = useMemo(
    () => roundedRectGeometry(WATCH_W - 0.07, WATCH_H - 0.07, WATCH_R - 0.035),
    [],
  );
  const cardBody = useMemo(() => deviceGeometry(0.4, 0.58, 0.014, 0.045, 0.004), []);

  useFrame(() => {
    const g = root.current;
    if (!g) return;
    const s = subjectStateAt(progress.current, CHAPTERS);

    g.position.set(0, s.positionY, s.positionZ);
    g.rotation.set(s.tiltX, s.rotationY, 0);
    g.scale.setScalar(s.scale);

    // The home screen sits under the app screens and dives into an icon as
    // the app dissolves in over it.
    // A display is only visible when it faces you. This also hides the app
    // swap, which happens while the device is turned away mid-rotation.
    const face = facing(s.rotationY);

    setOpacity(home.current, s.homeOn * face);
    applyHomeZoom(home.current, s.homeZoom, s.screenMix);

    setOpacity(screenA.current, s.screenOn * (1 - s.screenMix) * face);
    setOpacity(screenB.current, s.screenOn * s.screenMix * face);

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
      <Phone>
        <HomeScreen ref={home} />
        <group ref={screenA} visible={false}>
          <Screen url={xbillScreen} opacity={1} renderOrder={1} />
        </group>
        <group ref={screenB} visible={false}>
          <Screen url={spadeScreen} opacity={1} renderOrder={2} />
        </group>
      </Phone>

      <group ref={watch} visible={false}>
        <mesh geometry={watchBody}>
          <meshStandardMaterial
            color="#2b2e34"
            metalness={Math.max(metalness, 0.55)}
            roughness={0.24}
            envMapIntensity={1.4}
          />
        </mesh>
        {/* Black glass, so the Watch is a device rather than a white block. It
            carries no captured screen: that needs a paired watch simulator,
            which is not wired up. */}
        <mesh geometry={watchGlass} position={[0, 0, WATCH_D / 2 + 0.002]}>
          <meshStandardMaterial color="#04050a" metalness={0.35} roughness={0.2} />
        </mesh>
      </group>

      <group position={[-1.8, -0.2, 0.5]}>
        {Array.from({ length: CARDS }, (_, i) => (
          <mesh
            key={i}
            geometry={cardBody}
            ref={(m) => {
              cards.current[i] = m;
            }}
            visible={false}
          >
            {/* Face down and dark: white rectangles read as missing textures,
                not as playing cards. */}
            <meshStandardMaterial color="#1b2030" metalness={0.15} roughness={0.5} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
