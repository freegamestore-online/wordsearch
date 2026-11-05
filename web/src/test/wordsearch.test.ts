import { describe, expect, it } from "vitest";
import { WORD_LISTS, generatePuzzle, getLineCells, getWordCells } from "../lib/wordsearch";
import type { Theme } from "../types";

describe("wordsearch logic", () => {
  it("places words from every theme into the grid", () => {
    for (const theme of Object.keys(WORD_LISTS) as Theme[]) {
      const p = generatePuzzle(theme);
      expect(p.words.length).toBeGreaterThan(0);
      for (const placement of p.placements) {
        expect(WORD_LISTS[theme]).toContain(placement.word);
        const letters = [...getWordCells(placement)].map((k) => {
          const [r, c] = k.split(",").map(Number);
          return p.grid[r!]![c!];
        });
        expect(letters.join("")).toBe(placement.word);
      }
    }
  });

  it("only accepts straight lines", () => {
    expect(getLineCells(0, 0, 0, 3)).toHaveLength(4);
    expect(getLineCells(0, 0, 3, 3)).toEqual([[0, 0], [1, 1], [2, 2], [3, 3]]);
    expect(getLineCells(0, 0, 1, 3)).toBeNull();
  });
});
