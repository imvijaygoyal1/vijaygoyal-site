import { describe, expect, it } from "vitest";
import { fillTemplate, render } from "./entry-server";
import { PRODUCTS } from "./sections/content";

describe("the pre-render", () => {
  it("renders the whole home page as HTML, with no JavaScript", () => {
    const html = render("/");
    expect(html).toContain('class="word">products.</span>');
    for (const id of ["opening", "work", "process", "toolkit", "about", "contact"]) {
      expect(html, id).toContain(`id="${id}"`);
    }
    for (const p of PRODUCTS) {
      for (const fact of p.facts) expect(html, fact).toContain(fact.replace(/&/g, "&amp;"));
      for (const link of p.links) expect(html).toContain(`href="${link.href}"`);
    }
  });

  it("renders the not-found page for an unknown address", () => {
    expect(render("/nope")).toContain("This page doesn&#x27;t exist.");
  });

  it("prerender refuses a page with a template marker left", () => {
    expect(() => fillTemplate("<head><!--head--></head><div id=\"root\"></div>", "", "x")).toThrow(/head/);
    expect(() => fillTemplate("<head><!--head--></head><main></main>", "<title>t</title>", "x")).toThrow(/root/);
    expect(fillTemplate("<head><!--head--></head><div id=\"root\"></div>", "<title>t</title>", "<p>x</p>")).toBe(
      "<head><title>t</title></head><div id=\"root\"><p>x</p></div>",
    );
  });
});
