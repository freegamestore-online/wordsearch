import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { WORD_LISTS } from "../lib/wordsearch";

const shownWords = () => [...document.querySelectorAll(".min-w-\\[140px\\] > div")].slice(1).map((el) => el.textContent!);

describe("Word Search", () => {
  afterEach(() => vi.useRealTimers());

  it("lets the player pick any of the five themes", () => {
    render(<App />);
    for (const theme of ["Colors", "Foods", "Countries", "Sports", "Animals"] as const) {
      fireEvent.click(screen.getByRole("button", { name: theme }));
      expect(screen.getByRole("button", { name: theme }).getAttribute("aria-pressed")).toBe("true");
      expect(shownWords().length).toBeGreaterThan(0);
      for (const w of shownWords()) expect(WORD_LISTS[theme]).toContain(w);
    }
  });

  it("does not count time while the tab is hidden", () => {
    vi.useFakeTimers();
    render(<App />);
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(30_000);
    });
    hidden.mockReturnValue(false);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
      vi.advanceTimersByTime(2_000);
    });
    expect(screen.getByText("0:02")).toBeTruthy();
    hidden.mockRestore();
  });
});
