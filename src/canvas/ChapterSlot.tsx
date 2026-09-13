import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import type { Group, Material, Mesh } from "three";
import { chapterFade, fadeDirection, isVisible } from "../lib/fade";
import type { ProgressRef, ScrollRange } from "../lib/progress";

/** How far a chapter travels along the hand-off, in world units. */
const RECEDE = 1.6;
const LIFT = 3.4;

function isMesh(o: unknown): o is Mesh {
  return (o as Mesh).isMesh === true;
}

/**
 * Crossfades a chapter in and out around its own scroll range.
 *
 * Chapters used to switch with a hard boolean, so at every boundary one
 * device vanished and the next appeared on a single frame. Now the pair
 * crossfades: the outgoing one also recedes slightly, which separates the
 * two in depth so the overlap reads as a hand-off rather than as two
 * objects ghosting through each other.
 *
 * All of it runs in the render loop against Object3D and material state --
 * no React render is involved, so this costs nothing per frame beyond the
 * traversal, and that only happens while a fade is actually in progress.
 */
export function ChapterSlot({
  progress,
  range,
  children,
}: {
  progress: ProgressRef;
  range: ScrollRange;
  children: ReactNode;
}) {
  const group = useRef<Group>(null);
  const applied = useRef(-1);

  useFrame(() => {
    const g = group.current;
    if (!g) return;

    const fade = chapterFade(progress.current, range);
    g.visible = isVisible(fade);
    if (!g.visible) return;

    // Skip the traversal entirely while a chapter is simply "on".
    if (Math.abs(fade - applied.current) < 0.004) return;
    applied.current = fade;

    const fading = fade < 0.999;
    g.position.z = -RECEDE * (1 - fade);
    g.scale.setScalar(0.94 + 0.06 * fade);

    g.traverse((child) => {
      if (!isMesh(child)) return;
      const materials: Material[] = Array.isArray(child.material)
        ? child.material
        : [child.material];
      for (const m of materials) {
        // Transparency is switched on only while fading: leaving it on
        // permanently puts every mesh into the transparent sort pass.
        m.transparent = fading;
        m.opacity = fade;
        m.depthWrite = !fading;
      }
    });
  });

  return (
    <group ref={group} visible={false}>
      {children}
    </group>
  );
}
