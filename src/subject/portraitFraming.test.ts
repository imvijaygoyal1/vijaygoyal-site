import { describe, expect, it } from "vitest";
import { Object3D, PerspectiveCamera, Vector3 } from "three";
import { CHAPTERS } from "../chapters/registry";
import { cameraPoseAt } from "../canvas/cameraPose";
import { layoutFor } from "../lib/layout";
import { subjectStateAt } from "./sequence";
import { CARD_H, CARD_W, fanPlacement, fanYaw, handCardTransform } from "./cardFan";
import { BODY_H, BODY_W, WATCH_H, WATCH_W } from "./dimensions";
import { HAND } from "./cardFace";

/**
 * Does the set actually fit the frame?
 *
 * The owner saw the hand cut off on an iPhone 17 Pro, and the Watch was
 * cropped on every phone. Portrait framing fixed it with art-directed numbers
 * -- which a later tweak could undo with every other test green. This projects
 * the phone, the Watch and every card's corners through the real camera, at
 * real phone viewports, across the whole chapter.
 *
 * It rebuilds `Subject`'s transform chain from the same pure functions
 * (`subjectStateAt`, `fanPlacement`, `fanYaw`, `handCardTransform`) rather than
 * mounting the scene. If `Subject` gains a transform, this must gain it too.
 */

/** Canvas's default camera. */
const FOV = 75;
/** Watch offset and scale inside the subject group, as `Subject` sets them. */
const WATCH_AT = [1.08, -0.12, 0.62] as const;
const WATCH_SCALE = 1.12;

/** Visible Safari/Chrome viewports, toolbars included. */
export const PHONES: readonly (readonly [string, number, number])[] = [
  ["iPhone 17 Pro (Safari)", 402, 681],
  ["iPhone SE", 375, 553],
  ["360 Android", 360, 740],
  ["iPhone 17 Pro Max", 440, 764],
  ["Pixel 7", 412, 839],
];

function corners(obj: Object3D, w: number, h: number): Vector3[] {
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) =>
    new Vector3((sx! * w) / 2, (sy! * h) / 2, 0).applyMatrix4(obj.matrixWorld),
  );
}

/** Every visible corner of the set, projected to NDC, at one scroll position. */
export function projectSet(global: number, aspect: number) {
  const s = subjectStateAt(global, CHAPTERS);
  const pose = cameraPoseAt(global, aspect);
  const camera = new PerspectiveCamera(FOV, aspect, 0.1, 100);
  camera.position.set(...pose.position);
  camera.lookAt(...pose.lookAt);
  camera.updateMatrixWorld(true);

  const root = new Object3D();
  root.position.set(0, s.positionY, s.positionZ);
  root.rotation.set(s.tiltX, s.rotationY, 0);
  root.scale.setScalar(s.scale);

  const watch = new Object3D();
  watch.position.set(...WATCH_AT);
  watch.scale.setScalar(WATCH_SCALE);
  root.add(watch);

  const place = fanPlacement(layoutFor(aspect));
  const hand = new Object3D();
  hand.position.set(...place.position);
  hand.scale.setScalar(place.scale);
  root.add(hand);
  root.updateMatrixWorld(true);
  const handWorld = hand.getWorldPosition(new Vector3());
  hand.rotation.y = fanYaw(camera.position.x, camera.position.z, handWorld.x, handWorld.z, s.rotationY);

  const cards = HAND.flatMap((_, i) => {
    const t = handCardTransform(i, HAND.length, s.deal, place.step);
    if (!t.dealt) return [];
    const card = new Object3D();
    card.position.set(t.x, t.y, t.z);
    card.rotation.set(0, t.tiltY, t.rotation);
    card.scale.setScalar(t.scale);
    hand.add(card);
    return [card];
  });
  root.updateMatrixWorld(true);

  const project = (points: Vector3[]) => points.map((p) => p.project(camera));
  return {
    phone: project(corners(root, BODY_W, BODY_H)),
    watch: project(corners(watch, WATCH_W, WATCH_H)),
    cards: s.cards > 0.002 ? cards.flatMap((c) => project(corners(c, CARD_W, CARD_H))) : [],
  };
}

const spade = CHAPTERS.find((c) => c.id === "shady-spade")!;
const samples = Array.from({ length: 41 }, (_, i) => spade.range[0] + ((spade.range[1] - spade.range[0]) * i) / 40);

/** Inside the frame's edges, with a margin: an object touching the edge reads
 *  as cut off even when no pixel is lost. */
const EDGE = 0.95;
/** The set's lowest point stays above the frame's middle. On a phone the copy
 *  owns the lower half; the set crossing it is what covered the phone before. */
const ABOVE_COPY = 0.05;

describe("portrait framing", () => {
  for (const [name, w, h] of PHONES) {
    it(`fits the hand, phone and Watch inside the frame on ${name}, across the chapter`, () => {
      for (const g of samples) {
        const { phone, watch, cards } = projectSet(g, w / h);
        for (const [what, points] of [["phone", phone], ["watch", watch], ["cards", cards]] as const) {
          for (const p of points) {
            const at = `${what} at progress ${g.toFixed(3)}`;
            expect(Math.abs(p.x), `${at}: x`).toBeLessThanOrEqual(EDGE);
            expect(p.y, `${at}: top`).toBeLessThanOrEqual(EDGE);
            expect(p.y, `${at}: above the copy`).toBeGreaterThanOrEqual(ABOVE_COPY);
          }
        }
      }
    });
  }

  it("actually checks the cards while the hand is dealt", () => {
    // Guards the guard: a sample set that never sees cards would pass vacuously.
    const dealt = samples.filter((g) => projectSet(g, 402 / 681).cards.length > 0);
    expect(dealt.length).toBeGreaterThan(samples.length / 2);
  });
});
