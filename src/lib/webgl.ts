export function hasWebGL(
  canvasFactory: () => HTMLCanvasElement = () => document.createElement("canvas"),
): boolean {
  try {
    const ctx = canvasFactory().getContext("webgl2");
    if (!ctx) return false;
    // Release the probe context immediately. iOS caps the number of live WebGL
    // contexts, and this one has served its whole purpose by existing -- held
    // open, it competes with the canvas the site actually renders into.
    ctx.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}
