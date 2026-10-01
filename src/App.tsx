import { routeFor } from "./routes";

/** The page for an address; anything unknown is the not-found page. */
export function App({ path = "/" }: { path?: string }) {
  const Page = routeFor(path).component;
  return <Page />;
}
