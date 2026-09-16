import { useEffect, useState } from "react";
import { readFrameStats } from "../canvas/frameStats";
import { LINKS } from "../lib/links";

/**
 * Polls the render loop's stats on a slow interval. Deliberately not a
 * per-frame subscription: displaying the frame rate must not be the reason
 * the frame rate drops.
 */
function useFrameStats() {
  const [stats, setStats] = useState(() => readFrameStats());
  useEffect(() => {
    const id = setInterval(() => {
      const next = readFrameStats();
      // A fresh object every tick would re-render the footer twice a second
      // for the whole visit, including on routes with no scene at all.
      setStats((current) =>
        current.fps === next.fps && current.calls === next.calls ? current : { ...next },
      );
    }, 500);
    return () => clearInterval(id);
  }, []);
  return stats;
}

// Work and App Store both list the two apps by name, to different places; the
// accessible names say which, and still contain the visible label.
const GROUPS: readonly { title: string; links: readonly { href: string; label: string; name?: string }[] }[] = [
  {
    title: "Work",
    links: [
      { href: "#xbill", label: "xBill", name: "xBill on this page" },
      { href: "#shady-spade", label: "The Shady Spade", name: "The Shady Spade on this page" },
    ],
  },
  {
    title: "Connect",
    links: [
      { href: LINKS.linkedin, label: "LinkedIn" },
      { href: LINKS.github, label: "GitHub" },
      { href: LINKS.email, label: "Email" },
    ],
  },
  {
    title: "App Store",
    links: [
      { href: LINKS.xbillAppStore, label: "xBill", name: "xBill on the App Store" },
      { href: LINKS.spadeAppStore, label: "The Shady Spade", name: "The Shady Spade on the App Store" },
    ],
  },
  {
    title: "Apps",
    links: [
      { href: LINKS.xbillSite, label: "xbill.vijaygoyal.org" },
      { href: LINKS.spadeSite, label: "shadyspade.vijaygoyal.org" },
      { href: LINKS.spadePrivacy, label: "The Shady Spade privacy policy" },
    ],
  },
];

/**
 * Sits below the narrative, outside the chapter model: it has no pose, and
 * ScrollDriver measures the narrative rather than the document so the
 * footer's height cannot shift a single chapter boundary (AD-2).
 *
 * The apps own their sites and their privacy policy, so this links out rather
 * than duplicating them.
 */
export function Footer() {
  const { fps, calls } = useFrameStats();

  return (
    <footer className="site-footer">
      <p className="footer-name">Vijay Goyal</p>
      <nav className="footer-groups" aria-label="Footer">
        {GROUPS.map((group) => (
          <div key={group.title} className="footer-group">
            <h2>{group.title}</h2>
            <ul>
              {group.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} aria-label={link.name}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <p className="colophon-meta">
        Built with three.js and React.
        {fps > 0 ? ` Right now you are getting ${fps} fps at ${calls} draw calls.` : ""}
      </p>
    </footer>
  );
}
