import { useTexture } from "@react-three/drei";
import { useMemo } from "react";
import { SRGBColorSpace, type Texture } from "three";
import { roundedRectGeometry } from "../canvas/roundedRect";
import { WATCH_H, WATCH_R, WATCH_W } from "./dimensions";

const WATCH_HOME_URL = "/watch-home-screen.svg";

export function WatchHomeScreen() {
  const loaded = useTexture(WATCH_HOME_URL) as Texture;
  const texture = useMemo(() => {
    const copy = loaded.clone();
    copy.colorSpace = SRGBColorSpace;
    copy.needsUpdate = true;
    return copy;
  }, [loaded]);
  const geometry = useMemo(
    () => roundedRectGeometry(WATCH_W - 0.06, WATCH_H - 0.06, WATCH_R - 0.03),
    [],
  );

  return (
    <mesh geometry={geometry} position={[0, 0, 0.001]}>
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
