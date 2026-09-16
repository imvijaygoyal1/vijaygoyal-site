/**
 * Every outbound destination on the site, in one place. Each is sourced in
 * `docs/CONTENT.md` §1; `links.test.tsx` fails if a rendered URL is not.
 *
 * `index.html`'s noscript block cannot import this and repeats the ones it
 * uses -- that test reads the HTML too.
 */
export const LINKS = {
  email: "mailto:imvijaygoyal@gmail.com",
  linkedin: "https://www.linkedin.com/in/vijay-goyal-a37892a/",
  github: "https://github.com/imvijaygoyal1",
  xbillAppStore: "https://apps.apple.com/app/id6780284715",
  xbillSite: "https://xbill.vijaygoyal.org",
  spadeAppStore: "https://apps.apple.com/app/id6760261655",
  spadeSite: "https://shadyspade.vijaygoyal.org",
  spadePrivacy: "https://shadyspade.vijaygoyal.org/privacy",
} as const;
