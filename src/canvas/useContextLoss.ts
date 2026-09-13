/**
 * Listens for both halves of the context lifecycle.
 *
 * Listening for `webglcontextlost` alone makes loss permanent: on iOS Safari a
 * backgrounded tab routinely loses its context, and without the restore half
 * the visitor gets a static site until they reload, with no indication why.
 * Recovery is only possible while the canvas is still in the document, so the
 * caller must keep it mounted for a restore window rather than unmounting it
 * the moment loss is reported.
 */
export function attachContextLossHandlers(
  canvas: HTMLCanvasElement,
  onLost: () => void,
  onRestored: () => void = () => {},
): () => void {
  const handleLost = (event: Event) => {
    // Without preventDefault the browser will not fire webglcontextrestored.
    event.preventDefault();
    onLost();
  };
  const handleRestored = () => onRestored();

  canvas.addEventListener("webglcontextlost", handleLost);
  canvas.addEventListener("webglcontextrestored", handleRestored);

  return () => {
    canvas.removeEventListener("webglcontextlost", handleLost);
    canvas.removeEventListener("webglcontextrestored", handleRestored);
  };
}
