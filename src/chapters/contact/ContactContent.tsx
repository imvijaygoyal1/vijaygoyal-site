import { LINKS } from "../../lib/links";

export function ContactContent() {
  return (
    <div className="chapter-doc chapter-doc-narrow">
      <h2>Have an interesting idea?</h2>
      <p>I&rsquo;d love to hear about it.</p>
      <ul className="actions actions-start">
        <li>
          <a className="action action-primary" href={LINKS.email}>
            Let&rsquo;s connect <span aria-hidden="true">→</span>
          </a>
        </li>
      </ul>
      <ul className="link-row link-row-start">
        <li><a href={LINKS.email}>Email</a></li>
        <li><a href={LINKS.linkedin}>LinkedIn</a></li>
        <li><a href={LINKS.github}>GitHub</a></li>
      </ul>
    </div>
  );
}
