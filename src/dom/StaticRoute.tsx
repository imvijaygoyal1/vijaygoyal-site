import { CHAPTERS } from "../chapters/registry";

export function StaticRoute() {
  return (
    <main>
      {CHAPTERS.map(({ id, Content }) => (
        <section key={id} id={id}>
          <Content />
        </section>
      ))}
    </main>
  );
}
