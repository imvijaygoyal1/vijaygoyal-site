import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAfterFirstPaint } from "./useAfterFirstPaint";

function Probe({ seen }: { seen: boolean[] }) {
  seen.push(useAfterFirstPaint());
  return null;
}

describe("useAfterFirstPaint", () => {
  it("is false on the first render and true once the browser is idle", () => {
    vi.useFakeTimers();
    try {
      const seen: boolean[] = [];
      render(<Probe seen={seen} />);
      expect(seen[0]).toBe(false);
      act(() => {
        vi.runAllTimers();
      });
      expect(seen[seen.length - 1]).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});
