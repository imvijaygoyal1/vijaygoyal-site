import { ABOUT, CONTACT, DESCRIPTOR, OPENING, PRODUCTS, STAGES, TOOLKIT, type Product } from "./content";
import { LINKS } from "../lib/links";

/** The masthead: who this is, and the page's own sections. */
function Masthead() {
  return (
    <header className="masthead">
      <p className="masthead-name">Vijay Goyal</p>
      <nav aria-label="Sections">
        <ul>
          <li><a href="#work">Work</a></li>
          <li><a href="#process">How I build</a></li>
          <li><a href="#about">About</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>
    </header>
  );
}

function Opening() {
  return (
    <section className="opening" id="opening" aria-labelledby="opening-heading">
      <h1 id="opening-heading">{OPENING.heading}</h1>
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

function SectionHead({ id, title, note }: { id: string; title: string; note: string }) {
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
      <div>
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
      {/* Real captures, never a mockup (AD-14). Lazy: both sit below the fold. */}
      <img className="screen" src={product.screen} alt={product.screenAlt} loading="lazy" decoding="async" />
    </article>
  );
}

function Work() {
  return (
    <section className="section" id="work" aria-labelledby="work-heading">
      <SectionHead id="work" title="Selected work" note="Two products, built end to end" />
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
          <li className="stage" key={stage}>
            <span className="stage-index" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h3>{stage}</h3>
            <p>
              {emphasis
                ? copy.split(emphasis).flatMap((part, index, parts) =>
                    index < parts.length - 1 ? [part, <em key={index}>{emphasis}</em>] : [part],
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
      <SectionHead id="toolkit" title="Toolkit" note="Verified, nothing aspirational" />
      <dl className="toolkit">
        {TOOLKIT.map(({ area, items }) => (
          <div key={area}>
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
      <SectionHead id="about" title="About" note="Product thinker · builder · constant learner" />
      <div className="about">
        <div>
          <h3>{ABOUT.heading}</h3>
          {ABOUT.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <p className="photo-pending">Photograph</p>
      </div>
    </section>
  );
}

function Contact() {
  return (
    <section className="contact" id="contact" aria-labelledby="contact-heading">
      <div>
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

function Footer() {
  return (
    <footer className="site-footer">
      <span>© 2026 Vijay Goyal</span>
      <span>{DESCRIPTOR}</span>
    </footer>
  );
}

/**
 * The whole page. No canvas, no scroll engine: the site is a document about
 * two products, and everything on it is here in the first render.
 */
export function Page() {
  return (
    <div className="page">
      <a className="skip-link" href="#opening">Skip to introduction</a>
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
