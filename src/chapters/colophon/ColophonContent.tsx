import { useEffect, useState } from "react";
import { readFrameStats } from "../../canvas/frameStats";

/**
 * Polls the render loop's stats on a slow interval. Deliberately not a
 * per-frame subscription: displaying the frame rate must not be the reason
 * the frame rate drops.
 */
function useFrameStats() {
  const [stats, setStats] = useState(() => readFrameStats());
  useEffect(() => {
    const id = setInterval(() => setStats(readFrameStats()), 500);
    return () => clearInterval(id);
  }, []);
  return stats;
}

export function ColophonContent() {
  const { fps, calls } = useFrameStats();

  return (
    <div className="chapter-copy">
      <h2>Get in touch.</h2>
      <p>
        I build iOS apps on my own, end to end &mdash; design, code, backend,
        App&nbsp;Store. If that is useful to you, say hello.
      </p>
      <ul className="colophon-links">
        <li>
          <a href="https://github.com/imvijaygoyal1">GitHub</a>
        </li>
      </ul>
      <p className="colophon-meta">
        Built with three.js and React.
        {fps > 0 ? ` Right now you are getting ${fps} fps at ${calls} draw calls.` : ""}
      </p>
    </div>
  );
}
