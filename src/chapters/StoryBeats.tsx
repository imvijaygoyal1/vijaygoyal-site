export interface Beat {
  heading: string;
  copy: string;
}

export interface OutboundLink {
  href: string;
  label: string;
  /** Only where the visible label alone is ambiguous on this page — it must
   *  still contain the visible label, or voice control cannot target it. */
  name?: string;
}

/**
 * A product's four beats and its outbound links, shared by both product
 * sections so neither grows its own markup for the same shape.
 *
 * Over the scene the beats take turns, driven by the clock (see `beats.ts`
 * and `CopyFade`); anywhere else -- the static route, or a scene that never
 * loaded -- they are laid out in full. Per-beat captures replace this in a
 * later phase.
 */
export function StoryBeats({ beats, links }: { beats: readonly Beat[]; links: readonly OutboundLink[] }) {
  return (
    <>
      <ol className="beats">
        {beats.map((beat) => (
          <li key={beat.heading} className="beat">
            <h3>{beat.heading}</h3>
            <p>{beat.copy}</p>
          </li>
        ))}
      </ol>
      <ul className="link-row">
        {links.map((link) => (
          <li key={link.href}>
            <a href={link.href} aria-label={link.name}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
