import { afterEach, describe, expect, it } from "vitest";
import { observeNightScene, readSpots } from "./nightScene";

describe("readSpots", () => {
  it("reads the anchors a device carries", () => {
    const el = document.createElement("div");
    el.setAttribute("data-spots", JSON.stringify([{ x: 1, y: 2, w: 3, h: 4, label: "a" }]));
    expect(readSpots(el)).toEqual([{ x: 1, y: 2, w: 3, h: 4, label: "a" }]);
  });

  it("reads nothing, rather than throwing, from a broken attribute", () => {
    const el = document.createElement("div");
    el.setAttribute("data-spots", "{not json");
    expect(readSpots(el)).toEqual([]);
    expect(readSpots(document.createElement("div"))).toEqual([]);
  });
});

describe("observeNightScene", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("does nothing, and cleans up nothing, on a page without the scene", () => {
    const stop = observeNightScene(document);
    expect(() => stop()).not.toThrow();
  });

  it("leaves the page alone when it cannot drive the stage", () => {
    // jsdom has neither a 2D context nor `(scripting: enabled)`: the stand-in
    // for a browser that refuses either. The CSS resting pose then stands.
    document.body.innerHTML = '<div data-night><canvas data-bed></canvas></div>';
    const stop = observeNightScene(document);
    expect(document.querySelector("[data-night]")!.getAttribute("data-running")).toBeNull();
    stop();
  });
});
