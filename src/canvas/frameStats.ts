/**
 * A one-way channel from the render loop to the DOM.
 *
 * The colophon shows the frame rate the visitor is actually getting. That
 * number is produced inside `useFrame`, but React must not re-render sixty
 * times a second to display it -- so the loop writes here, and the DOM reads
 * on a slow interval. Nothing subscribes per frame.
 */
export interface FrameStats {
  fps: number;
  calls: number;
}

const stats: FrameStats = { fps: 0, calls: 0 };

let frames = 0;
/** -1 rather than 0: a timestamp of 0 is a legal value, and using it as the
 *  sentinel means the baseline is re-established forever and the rate never
 *  reports. */
let windowStart = -1;

/** Called once per frame from inside the canvas. Cheap by construction. */
export function recordFrame(nowMs: number, calls: number): void {
  // The first call only establishes the baseline. Counting it too would
  // credit a frame with no elapsed time and overstate the rate.
  if (windowStart < 0) {
    windowStart = nowMs;
    return;
  }
  frames++;
  const elapsed = nowMs - windowStart;
  if (elapsed >= 500) {
    stats.fps = Math.round((frames * 1000) / elapsed);
    stats.calls = calls;
    frames = 0;
    windowStart = nowMs;
  }
}

export function readFrameStats(): FrameStats {
  return { fps: stats.fps, calls: stats.calls };
}

/** Test seam: the module holds state across a suite otherwise. */
export function resetFrameStats(): void {
  stats.fps = 0;
  stats.calls = 0;
  frames = 0;
  windowStart = -1;
}
