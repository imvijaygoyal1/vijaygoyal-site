export function hasWebGL(
  canvasFactory: () => HTMLCanvasElement = () => document.createElement("canvas"),
): boolean {
  try {
    return canvasFactory().getContext("webgl2") !== null;
  } catch {
    return false;
  }
}
