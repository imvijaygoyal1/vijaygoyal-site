import { useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import { roundedRectGeometry } from "../canvas/roundedRect";
import { WATCH_H, WATCH_R, WATCH_W } from "./dimensions";

export function WatchHomeScreen() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 370;
    canvas.height = 430;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to create the Watch face canvas");

    // A high-contrast navy face remains recognizable against the site's dark
    // stage while retaining the default Apple Watch treatment.
    context.fillStyle = "#17243a";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#1c2027";
    context.lineWidth = 28;
    context.beginPath();
    context.arc(185, 225, 126, 0, Math.PI * 2);
    context.stroke();
    const arcs = [
      ["#ff3b30", -Math.PI / 2, 0.9],
      ["#30d158", -Math.PI / 2 + 0.95, 1.7],
      ["#0a84ff", -Math.PI / 2 + 1.75, 2.65],
    ] as const;
    for (const [color, start, end] of arcs) {
      context.strokeStyle = color;
      context.lineCap = "round";
      context.beginPath();
      context.arc(185, 225, 126, start, end);
      context.stroke();
    }
    context.textAlign = "center";
    context.fillStyle = "#f5f5f7";
    context.font = "600 78px -apple-system, Helvetica, sans-serif";
    context.fillText("10:09", 185, 166);
    context.fillStyle = "#aeb4bf";
    context.font = "18px -apple-system, Helvetica, sans-serif";
    context.fillText("Sunday, September 13", 185, 198);
    context.fillStyle = "#f5f5f7";
    context.font = "22px -apple-system, Helvetica, sans-serif";
    context.fillText("72°", 185, 246);
    for (const [x, color, value] of [[115, "#ff9f0a", "72"], [255, "#bf5af2", "87"]] as const) {
      context.fillStyle = "#171a20";
      context.beginPath();
      context.arc(x, 310, 24, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = color;
      context.lineWidth = 5;
      context.stroke();
      context.fillStyle = "#f5f5f7";
      context.font = "19px -apple-system, Helvetica, sans-serif";
      context.fillText(value, x, 318);
    }

    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    return result;
  }, []);
  const geometry = useMemo(
    () => roundedRectGeometry(WATCH_W - 0.06, WATCH_H - 0.06, WATCH_R - 0.03),
    [],
  );

  return (
    <mesh geometry={geometry} position={[0, 0, 0.001]} frustumCulled={false} renderOrder={21}>
      <meshBasicMaterial
        map={texture}
        toneMapped={false}
        color="#ffffff"
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}
