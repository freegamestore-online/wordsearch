import { useState, useCallback } from "react";
import { GameShell, GameTopbar, GameAuth } from "@freegamestore/games";
import { Game } from "./components/Game";
import type { Theme } from "./types";
import { WORD_LISTS } from "./lib/wordsearch";

const BEST_SCORE_KEY = "freewordsearch-best";
function getBestScore(): number {
  const v = localStorage.getItem(BEST_SCORE_KEY);
  return v ? parseInt(v, 10) : 0;
}

export default function App() {
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("playing");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(getBestScore);
  const [theme, setTheme] = useState<Theme>("Animals");
  const [gameKey, setGameKey] = useState(0);

  const handleFinish = useCallback(
    (seconds: number) => {
      const final = Math.max(0, 10000 - seconds);
      setScore(final);
      const best = getBestScore();
      if (final > best) {
        localStorage.setItem(BEST_SCORE_KEY, String(final));
        setBestScore(final);
      }
      setPhase("over");
    },
    [],
  );

  const start = useCallback(() => {
    setScore(0);
    setGameKey((k) => k + 1);
    setPhase("playing");
  }, []);

  const changeTheme = useCallback(
    (t: Theme) => {
      setTheme(t);
      start();
    },
    [start],
  );

  return (
    <GameShell
      topbar={
        <GameTopbar
          title="Word Search"
          stats={[
            { label: "Score", value: score, accent: true },
            { label: "Best", value: bestScore },
          ]}
          onRestart={start}
          actions={<GameAuth />}
          rules={
            <div>
              <h3 style={{ fontWeight: 700 }}>Word Search</h3>
              <h4 style={{ fontWeight: 600 }}>Rules</h4>
              <ul><li>Find all hidden words in the letter grid</li><li>Words can go horizontal, vertical, or diagonal</li><li>Five themes to choose from</li></ul>
              <h4 style={{ fontWeight: 600 }}>Controls</h4>
              <ul><li>Drag across letters to select a word</li><li>Timer tracks your speed</li></ul>
            </div>
          }
        />
      }
    >
      <div className="relative w-full h-full flex flex-col">
        <div className="flex flex-wrap justify-center gap-2 px-4 pt-4 shrink-0" role="group" aria-label="Theme">
          {(Object.keys(WORD_LISTS) as Theme[]).map((t) => (
            <button
              key={t}
              onClick={() => changeTheme(t)}
              aria-pressed={theme === t}
              className="px-3 py-1.5 text-sm font-semibold rounded-lg min-h-[2.75rem]"
              style={{
                background: theme === t ? "var(--accent)" : "var(--panel)",
                color: theme === t ? "#fff" : "var(--muted)",
                border: `1px solid ${theme === t ? "var(--accent)" : "var(--line)"}`,
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex-1 min-h-0">
          <Game key={gameKey} theme={theme} onFinish={handleFinish} />
        </div>
        {phase === "over" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ background: "rgba(0,0,0,0.55)" }}>
            <p
              className="text-xl font-bold"
              style={{ color: "var(--success)", fontFamily: "Fraunces, serif" }}
            >
              Completed! Score: {score}
            </p>
            <button
              onClick={start}
              className="px-6 py-3 rounded-xl font-semibold min-h-[2.75rem]"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
