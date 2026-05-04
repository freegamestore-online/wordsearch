import { useState, useCallback, useRef, useEffect } from "react";
import { generatePuzzle, getWordCells } from "../lib/wordsearch";
import type { Theme } from "../types";

const GRID_SIZE = 12;

const HIGHLIGHT_COLORS = [
  "#2563eb", "#dc2626", "#16a34a", "#d97706",
  "#8b5cf6", "#ec4899", "#0891b2", "#65a30d",
  "#e11d48", "#7c3aed",
];

interface GameProps {
  theme: Theme;
  onFinish: (seconds: number) => void;
}

interface FoundWord {
  word: string;
  colorIndex: number;
  cells: Set<string>;
}

function getCellKey(row: number, col: number): string {
  return `${row},${col}`;
}

/** Given start and end grid cells, return all cells along the line if it's a valid direction */
function getLineCells(
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
): [number, number][] | null {
  const dRow = endRow - startRow;
  const dCol = endCol - startCol;

  // Must be horizontal, vertical, or diagonal
  if (dRow === 0 && dCol === 0) return [[startRow, startCol]];

  const absDr = Math.abs(dRow);
  const absDc = Math.abs(dCol);

  // Valid directions: straight line (same row, same col, or |dRow| === |dCol|)
  if (absDr !== 0 && absDc !== 0 && absDr !== absDc) return null;

  const steps = Math.max(absDr, absDc);
  const stepR = dRow === 0 ? 0 : dRow / steps;
  const stepC = dCol === 0 ? 0 : dCol / steps;

  const cells: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    cells.push([startRow + i * stepR, startCol + i * stepC]);
  }
  return cells;
}

export function Game({ theme, onFinish }: GameProps) {
  const [puzzle] = useState(() => generatePuzzle(theme));
  const [foundWords, setFoundWords] = useState<FoundWord[]>([]);
  const [selectionStart, setSelectionStart] = useState<[number, number] | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<[number, number] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [finished, setFinished] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const startTimeRef = useRef(Date.now());

  // Timer
  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 250);
    return () => clearInterval(timerRef.current);
  }, []);

  // Check win
  useEffect(() => {
    if (foundWords.length === puzzle.words.length && puzzle.words.length > 0 && !finished) {
      setFinished(true);
      clearInterval(timerRef.current);
      const finalSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      onFinish(finalSeconds);
    }
  }, [foundWords.length, puzzle.words.length, finished, onFinish]);

  // Build a map of found-word cells to their color
  const foundCellColors = useCallback((): Map<string, string> => {
    const map = new Map<string, string>();
    for (const fw of foundWords) {
      const color = HIGHLIGHT_COLORS[fw.colorIndex % HIGHLIGHT_COLORS.length]!;
      for (const key of fw.cells) {
        map.set(key, color);
      }
    }
    return map;
  }, [foundWords]);

  const checkSelection = useCallback(
    (start: [number, number], end: [number, number]) => {
      const cells = getLineCells(start[0], start[1], end[0], end[1]);
      if (!cells) return;

      const selectedWord = cells.map(([r, c]) => puzzle.grid[r]![c]!).join("");
      const reversedWord = [...selectedWord].reverse().join("");

      // Check against placements
      for (const placement of puzzle.placements) {
        if (placement.word !== selectedWord && placement.word !== reversedWord) continue;

        // Already found?
        if (foundWords.some((fw) => fw.word === placement.word)) continue;

        const wordCells = getWordCells(placement);
        const selCells = new Set(cells.map(([r, c]) => getCellKey(r, c)));

        // Check exact match of cells
        if (wordCells.size !== selCells.size) continue;
        let match = true;
        for (const k of wordCells) {
          if (!selCells.has(k)) {
            match = false;
            break;
          }
        }
        if (!match) continue;

        setFoundWords((prev) => [
          ...prev,
          { word: placement.word, colorIndex: prev.length, cells: wordCells },
        ]);
        return;
      }
    },
    [puzzle, foundWords],
  );

  // Resolve grid cell from a pointer/touch event
  const getCellFromEvent = useCallback(
    (clientX: number, clientY: number): [number, number] | null => {
      const gridEl = gridRef.current;
      if (!gridEl) return null;
      const rect = gridEl.getBoundingClientRect();
      const cellSize = rect.width / GRID_SIZE;
      const col = Math.floor((clientX - rect.left) / cellSize);
      const row = Math.floor((clientY - rect.top) / cellSize);
      if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return null;
      return [row, col];
    },
    [],
  );

  // --- Pointer events for drag selection ---
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const cell = getCellFromEvent(e.clientX, e.clientY);
      if (!cell) return;
      setSelectionStart(cell);
      setSelectionEnd(cell);
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [getCellFromEvent],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const cell = getCellFromEvent(e.clientX, e.clientY);
      if (cell) {
        setSelectionEnd(cell);
      }
    },
    [isDragging, getCellFromEvent],
  );

  const handlePointerUp = useCallback(() => {
    if (selectionStart && selectionEnd) {
      checkSelection(selectionStart, selectionEnd);
    }
    setSelectionStart(null);
    setSelectionEnd(null);
    setIsDragging(false);
  }, [selectionStart, selectionEnd, checkSelection]);

  // Compute current selection cells
  const selectionCells = new Set<string>();
  if (selectionStart && selectionEnd) {
    const cells = getLineCells(selectionStart[0], selectionStart[1], selectionEnd[0], selectionEnd[1]);
    if (cells) {
      for (const [r, c] of cells) {
        selectionCells.add(getCellKey(r, c));
      }
    }
  }

  const cellColors = foundCellColors();
  const foundWordSet = new Set(foundWords.map((fw) => fw.word));

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 h-full overflow-auto">
      {/* Timer */}
      <div
        className="text-2xl font-bold"
        style={{ fontFamily: "Fraunces, serif" }}
      >
        {formatTime(seconds)}
      </div>

      {/* Grid + Word List layout */}
      <div className="flex flex-col md:flex-row gap-6 items-start w-full max-w-3xl">
        {/* Grid */}
        <div
          ref={gridRef}
          className="grid select-none touch-none shrink-0"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            width: "min(100%, 480px)",
            aspectRatio: "1",
            gap: 0,
            userSelect: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {puzzle.grid.map((row, r) =>
            row.map((letter, c) => {
              const key = getCellKey(r, c);
              const foundColor = cellColors.get(key);
              const isSelected = selectionCells.has(key);

              return (
                <div
                  key={key}
                  className="flex items-center justify-center font-bold"
                  style={{
                    fontSize: "min(28px, calc(min(100vw - 2rem, 480px) / 14))",
                    aspectRatio: "1",
                    background: foundColor
                      ? foundColor
                      : isSelected
                        ? "var(--accent)"
                        : "transparent",
                    color: foundColor || isSelected ? "#fff" : "var(--ink)",
                    borderRadius: "0.25rem",
                    transition: "background 0.1s",
                    lineHeight: 1,
                  }}
                >
                  {letter}
                </div>
              );
            }),
          )}
        </div>

        {/* Word List */}
        <div className="flex flex-col gap-1 min-w-[140px]">
          <div
            className="text-sm font-semibold mb-1"
            style={{ color: "var(--muted)" }}
          >
            Words ({foundWords.length}/{puzzle.words.length})
          </div>
          {puzzle.words.map((word) => {
            const found = foundWordSet.has(word);
            const fw = foundWords.find((f) => f.word === word);
            const color = fw
              ? HIGHLIGHT_COLORS[fw.colorIndex % HIGHLIGHT_COLORS.length]
              : undefined;
            return (
              <div
                key={word}
                className="text-sm font-semibold"
                style={{
                  textDecoration: found ? "line-through" : "none",
                  color: found ? color : "var(--ink)",
                  opacity: found ? 0.7 : 1,
                }}
              >
                {word}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
