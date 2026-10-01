import { Footer, Masthead } from "./Page";

/** The page Cloudflare serves, with status 404, for any unknown address. */
export function NotFound() {
  return (
    <div className="page">
      <Masthead base="/" />
      <main id="main-content">
        <section className="not-found" aria-labelledby="not-found-heading">
          <h1 id="not-found-heading">This page doesn't exist.</h1>
          <p>The address may be mistyped, or the page may have moved.</p>
          <a className="action" href="/">
            Go to the home page
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
