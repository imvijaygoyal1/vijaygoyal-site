import { localProgress } from "../lib/progress";
import { sampleKeyframes, type CameraPose } from "../lib/keyframes";
import { easeInOutCubic } from "../lib/ease";
import { layoutFor } from "../lib/layout";
import { CHAPTERS } from "../chapters/registry";
import { keyframesFor, type RegisteredChapter } from "../chapters/types";

/**
 * Where the camera is at a point in the narrative, for a frame of a given
 * shape. Pure, so which track a frame gets -- wide or portrait -- is testable
 * without a render loop; `CameraRig` only applies the result.
 */
export function cameraPoseAt(
  global: number,
  aspect: number,
  chapters: readonly RegisteredChapter[] = CHAPTERS,
): CameraPose {
  const chapter =
    chapters.find((c) => global >= c.range[0] && global <= c.range[1]) ?? chapters[0]!;
  // Eased: a camera that starts and stops abruptly is the clearest tell that a
  // scene was never art-directed.
  return sampleKeyframes(
    keyframesFor(chapter, layoutFor(aspect)),
    easeInOutCubic(localProgress(global, chapter.range)),
  );
}
