import { Fragment, useEffect, useLayoutEffect } from "react";
import { playHeadline } from "../lib/headline";
import { observeReveals } from "../lib/reveal";
import { observeNightScene } from "../scene/nightScene";
import {
  SCREEN_H,
  SCREEN_W,
  ABOUT,
  ICON_SIZE,
  SCENE,
  CONTACT,
  DESCRIPTOR,
  OPENING,
  PRODUCTS,
  STAGES,
  TOOLKIT,
  type Product,
} from "./content";
import { LINKS } from "../lib/links";

/** The masthead: who this is, and the page's own sections. */
export function Masthead({ base = "" }: { base?: string }) {
  return (
    <header className="masthead">
      <p className="masthead-name">Vijay Goyal</p>
      <nav aria-label="Sections">
        <ul>
          <li>
            <a href={`${base}#work`}>Work</a>
          </li>
          <li>
            <a href={`${base}#process`}>How I build</a>
          </li>
          <li>
            <a href={`${base}#about`}>About</a>
          </li>
          <li>
            <a href={`${base}#contact`}>Contact</a>
          </li>
        </ul>
      </nav>
    </header>
  );
}

function Opening() {
  return (
    <section className="opening" id="opening" aria-labelledby="opening-heading">
      <h1 id="opening-heading">
        {/* Two lines, each a clipping box the words rise out of, one word at
            a time (lib/headline.ts). They still wrap naturally at any width --
            the spans are inline. */}
        {OPENING.lines.map((line) => (
          <span className="line" key={line}>
            <span className="line-inner">
              {line
                .trim()
                .split(" ")
                .map((word, i, all) => (
                  <Fragment key={word}>
                    <span className="word">{word}</span>
                    {i < all.length - 1 ? " " : null}
                  </Fragment>
                ))}
              {line.endsWith(" ") ? " " : null}
            </span>
          </span>
        ))}
      </h1>
      <div className="rows">
        {OPENING.rows.map((row) => (
          <div className="row" key={row.label}>
            <p className="label">{row.label}</p>
            <p>{row.copy}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHead({
  id,
  title,
  note,
}: {
  id: string;
  title: string;
  note: string;
}) {
  return (
    <div className="section-head">
      <h2 id={`${id}-heading`}>{title}</h2>
      <p className="section-note">{note}</p>
    </div>
  );
}

function WorkItem({ product }: { product: Product }) {
  return (
    <article className="work-item" id={product.id} data-accent={product.accent}>
      <div className="work-intro" data-reveal>
        <span className="work-eyebrow">{product.eyebrow}</span>
        <h3>{product.heading}</h3>
        <p>{product.lede}</p>
        <ul className="beats">
          {product.beats.map((beat) => (
            <li className="beat" key={beat.heading}>
              <h4>{beat.heading}</h4>
              <p>{beat.copy}</p>
            </li>
          ))}
        </ul>
        <ul className="facts">
          {product.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
        {/* Every submission, from data/releases.json. Closed by default: the
            live version is already in the facts line above it. */}
        <details className="releases">
          <summary>Release history · {product.releases.length}</summary>
          <ol>
            {product.releases.map((r) => (
              <li key={r.key}>
                <span className="release-version">{r.version}</span>
                <span>{[r.when, r.outcome, r.tests].filter(Boolean).join(" · ")}</span>
              </li>
            ))}
          </ol>
        </details>
        <ul className="facts work-links">
          {product.links.map((link) => (
            <li key={link.href}>
              <a className="action" href={link.href} aria-label={link.name}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

/**
 * The night stage: both products on one pinned scene, over a drawn lotus.
 * Everything here is in the first render; scene/nightScene.ts only moves it.
 * With no script, CSS lays it out as a plain pair of captures.
 */
function NightScene() {
  return (
    <div className="night" data-night="">
      <div className="night-pin">
        <canvas className="night-bed" data-bed="" aria-hidden="true" />
        <div className="night-stage">
          {PRODUCTS.map((product) => (
            <div
              className="night-device"
              key={product.id}
              data-device={product.accent}
              data-accent={product.accent}
              data-spots={JSON.stringify(product.spots)}
            >
              {/* Real captures, never a mockup (AD-14). */}
              <img
                src={product.screen}
                alt={product.screenAlt}
                width={SCREEN_W}
                height={SCREEN_H}
                loading="lazy"
                decoding="async"
              />
              {/* The overlay's viewBox is the capture's own pixel space, so an
                  anchor in content.ts lands on the thing it names at every size. */}
              <svg
                viewBox={`0 0 ${SCREEN_W} ${SCREEN_H}`}
                preserveAspectRatio="none"
                aria-hidden="true"
                focusable="false"
              >
                <mask id={`night-${product.accent}`}>
                  <rect width={SCREEN_W} height={SCREEN_H} fill="#fff" />
                  <rect data-hole="" rx="18" fill="#000" />
                </mask>
                <rect
                  className="night-veil"
                  data-veil=""
                  width={SCREEN_W}
                  height={SCREEN_H}
                  mask={`url(#night-${product.accent})`}
                />
                <rect className="night-frame" data-frame="" rx="18" />
              </svg>
            </div>
          ))}
        </div>
        {PRODUCTS.map((product) => (
          <img
            className="night-icon"
            key={product.id}
            data-icon={product.accent}
            data-accent={product.accent}
            src={product.icon}
            alt={product.iconAlt}
            width={ICON_SIZE}
            height={ICON_SIZE}
            decoding="async"
          />
        ))}
        <p className="night-beat" data-night-beat="" aria-hidden="true">
          {SCENE.beats[0]}
        </p>
        <p className="night-caption" data-night-caption="" aria-hidden="true" />
        <p className="night-readout" data-night-readout="" aria-hidden="true">
          0%
        </p>
      </div>
    </div>
  );
}

function Work() {
  return (
    <section className="section" id="work" aria-labelledby="work-heading">
      <SectionHead
        id="work"
        title="Selected work"
        note="Two products, built end to end"
      />
      <NightScene />
      {PRODUCTS.map((product) => (
        <WorkItem key={product.id} product={product} />
      ))}
    </section>
  );
}

function Process() {
  return (
    <section className="section" id="process" aria-labelledby="process-heading">
      <SectionHead id="process" title="How I build" note="Problem → store" />
      <ol className="stages">
        {STAGES.map(({ stage, copy, emphasis }, i) => (
          <li className="stage" data-reveal key={stage}>
            <span className="stage-index" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3>{stage}</h3>
            <p>
              {emphasis
                ? copy
                    .split(emphasis)
                    .flatMap((part, index, parts) =>
                      index < parts.length - 1
                        ? [part, <em key={index}>{emphasis}</em>]
                        : [part],
                    )
                : copy}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Toolkit() {
  return (
    <section className="section" id="toolkit" aria-labelledby="toolkit-heading">
      <SectionHead
        id="toolkit"
        title="Toolkit"
        note="Verified, nothing aspirational"
      />
      <dl className="toolkit">
        {TOOLKIT.map(({ area, items }) => (
          <div data-reveal key={area}>
            <dt>{area}</dt>
            <dd>{items}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function About() {
  return (
    <section className="section" id="about" aria-labelledby="about-heading">
      <SectionHead
        id="about"
        title="About"
        note="Product thinker · builder · constant learner"
      />
      <div className="about">
        <div data-reveal>
          <h3>{ABOUT.heading}</h3>
          {ABOUT.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section className="contact" id="contact" aria-labelledby="contact-heading">
      <div data-reveal>
        <h2 id="contact-heading">{CONTACT.heading}</h2>
        <p>{CONTACT.copy}</p>
      </div>
      <div>
        <a className="action contact-mail" href={LINKS.email}>
          imvijaygoyal@gmail.com
        </a>
        <ul className="link-list">
          {CONTACT.links.map((link) => (
            <li key={link.href}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <span>© 2026 Vijay Goyal</span>
      <span>{DESCRIPTOR}</span>
    </footer>
  );
}

/**
 * The whole page. Everything on it is here in the first render; the one 2D
 * canvas, the night scene's lotus, is drawn from the first animation frame.
 */
export function Page() {
  // Arrivals are marked by an observer rather than by CSS scroll timelines:
  // see lib/reveal.ts. The effect runs after the first paint, so nothing is
  // hidden before it starts.
  useEffect(() => observeReveals(), []);
  // Before first paint, so the words are already at their start pose.
  useLayoutEffect(() => playHeadline(), []);
  // A layout effect, so the scene's first frame is set before first paint:
  // see scene/nightScene.ts.
  useLayoutEffect(() => observeNightScene(), []);

  return (
    <div className="page">
      <a className="skip-link" href="#opening">
        Skip to introduction
      </a>
      <Masthead />
      <main id="main-content">
        <Opening />
        <Work />
        <Process />
        <Toolkit />
        <About />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
