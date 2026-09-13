import { describe, expect, it } from "vitest";

describe("test harness", () => {
  it("runs and has a DOM", () => {
    expect(typeof document).toBe("object");
  });
});
