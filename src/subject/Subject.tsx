import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Group, Material, Mesh } from "three";
import { CHAPTERS } from "../chapters/registry";
import { subjectStateAt } from "./sequence";
import { Phone } from "./Phone";
import { Screen } from "./Screen";
import { applyHomeZoom, HomeScreen } from "./HomeScreen";
import { facing } from "./facing";
import { swapOpacities } from "./screenSwap";
import { deviceGeometry } from "../canvas/deviceGeometry";
import { roundedRectGeometry } from "../canvas/roundedRect";
import { HAND } from "./cardFace";
import { useCardTextures } from "./useCardTextures";
import { TIER_SETTINGS } from "../lib/tier";
import { useTier } from "../canvas/QualityProvider";
import { WatchHomeScreen } from "./WatchHomeScreen";
import { watchOpacity } from "./watchPresentation";
import type { ProgressRef } from "../lib/progress";
import xbillScreen from "../chapters/xbill/xbill-screen.webp";
import spadeScreen from "../chapters/shadyspade/spade-screen.webp";

/** How far the translucent copies travel at full split / full separation. */
const CARDS = HAND.length;
const CARD_W = 0.4;
const CARD_H = 0.58;
const CARD_D = 0.014;
const CARD_R = 0.045;

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
  const cards = useRef<(Group | null)[]>([]);
  const home = useRef<Group>(null);
  const screenA = useRef<Group>(null);
  const screenB = useRef<Group>(null);
  const cardBody = useMemo(
    () => deviceGeometry(CARD_W, CARD_H, CARD_D, CARD_R, 0.004),
    [],
  );
  const cardFace = useMemo(
    () => roundedRectGeometry(CARD_W, CARD_H, CARD_R),
    [],
  );
  const hardwareMax = useThree((s) => s.gl.capabilities.getMaxAnisotropy());
  const cardTextures = useCardTextures(
    Math.min(TIER_SETTINGS[useTier()].anisotropy, hardwareMax),
  );

  useFrame(() => {
    const g = root.current;
    if (!g) return;
    const s = subjectStateAt(progress.current, CHAPTERS);

    g.position.set(0, s.positionY, s.positionZ);
    g.rotation.set(s.tiltX, s.rotationY, 0);
    g.scale.setScalar(s.scale);

    // The home screen sits under the app screens and dives into an icon as
    // the app dissolves in over it.
    // A display is only visible when it faces you. With no shell behind it,
    // that also bounds how far the subject may turn -- see MAX_TURN.
    const face = facing(s.rotationY);

    setOpacity(home.current, s.homeOn * face);
    applyHomeZoom(home.current, s.homeZoom, s.screenMix);

    const [outgoing, incoming] = swapOpacities(s.screenMix);
    setOpacity(screenA.current, s.screenOn * outgoing * face);
    setOpacity(screenB.current, s.screenOn * incoming * face);

    const w = watch.current;
    if (w) {
      const shadySpade = CHAPTERS.find((chapter) => chapter.id === "shady-spade");
      const inShadySpade = shadySpade
        ? progress.current >= shadySpade.range[0] && progress.current <= shadySpade.range[1]
        : false;
      w.position.set(1.08, -0.12, 0.62);
      w.scale.setScalar(1.12);
      w.renderOrder = 20;
      setOpacity(w, watchOpacity(s.companion, inShadySpade));
    }

    for (let i = 0; i < CARDS; i++) {
      const card = cards.current[i];
      if (!card) continue;
      const angle = (i - (CARDS - 1) / 2) * 0.26 * s.cards;
      card.rotation.z = angle;
      // Each card gets its own depth. They were all at z = 0, so overlapping
      // cards in the fan were coplanar and z-fought -- the diagonal hatching
      // across the faces was that, not a texture problem.
      card.position.set(Math.sin(angle) * 1.5, -Math.abs(angle) * 0.5, i * 0.006);
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
        <WatchHomeScreen />
      </group>

      <group position={[-1.8, -0.2, 0.5]}>
        {HAND.map((card, i) => (
          <group
            key={`${card.rank}${card.suit}`}
            ref={(g) => {
              cards.current[i] = g;
            }}
            visible={false}
          >
            {/* The stock, which supplies the edge the face has no thickness
                for. Paper, so barely any specular. */}
            <mesh geometry={cardBody}>
              <meshStandardMaterial color="#f7f4ec" metalness={0} roughness={0.6} />
            </mesh>
            {/* Why the faces read as dull grey paper rather than bright card:
                R3F's renderer defaults to ACES filmic tone mapping, which
                compresses white hard, and the scene's only directional light
                is at x=+3 while the fan sits at x=-1.8 -- so these were lit by
                little more than ambient and then greyed by the tone curve.

                `toneMapped={false}` is the same opt-out the app screens use.
                The emissive map lifts the face off the dark stage wherever the
                lights do not reach it, so clarity no longer depends on the
                card's angle. Roughness still leaves a highlight for the sheen
                to travel across as the fan turns. */}
            <mesh geometry={cardFace} position={[0, 0, CARD_D / 2 + 0.0015]}>
              <meshStandardMaterial
                map={cardTextures[i]}
                emissive="#ffffff"
                emissiveMap={cardTextures[i]}
                emissiveIntensity={0.34}
                toneMapped={false}
                metalness={0}
                roughness={0.45}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
