export function attachContextLossHandlers(
  canvas: HTMLCanvasElement,
  onLost: () => void,
): () => void {
  const handleLost = (event: Event) => {
    event.preventDefault();
    onLost();
  };
  canvas.addEventListener("webglcontextlost", handleLost);
  return () => canvas.removeEventListener("webglcontextlost", handleLost);
}
