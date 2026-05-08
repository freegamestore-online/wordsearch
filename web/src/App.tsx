import { useState, useCallback, useRef } from "react";
import { GameShell, GameTopbar, GameAuth } from "@freegamestore/games";
import { Game } from "./components/Game";
import type { Theme } from "./types";

const BEST_SCORE_KEY = "freewordsearch-best";
const THEMES: Theme[] = ["Animals", "Colors", "Foods", "Countries", "Sports"];

function getBestScore(): number {
  const v = localStorage.getItem(BEST_SCORE_KEY);
  return v ? parseInt(v, 10) : 0;
}

export default function App() {
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("menu");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(getBestScore);
  const [theme, setTheme] = useState<Theme>("Animals");
  const [gameKey, setGameKey] = useState(0);
  const scoreRef = useRef(0);

  const handleFinish = useCallback(
    (seconds: number) => {
      const final = Math.max(0, 10000 - seconds);
      scoreRef.current = final;
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
    scoreRef.current = 0;
    setGameKey((k) => k + 1);
    setPhase("playing");
  }, []);

  return (
    <GameShell
      topbar={
        <GameTopbar
          title="Word Search"
          stats={[
            { label: "Score", value: score, accent: true },
            { label: "Best", value: bestScore },
          ]}
          actions={<GameAuth />}
        />
      }
    >
      <div className="relative w-full h-full">
        {phase === "playing" ? (
          <Game key={gameKey} theme={theme} onFinish={handleFinish} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <h1
              className="text-4xl font-bold"
              style={{ fontFamily: "Fraunces, serif" }}
            >
              Word Search
            </h1>
            {phase === "over" && (
              <p
                className="text-xl font-bold"
                style={{ color: "var(--success)", fontFamily: "Fraunces, serif" }}
              >
                Completed! Score: {score}
              </p>
            )}
            <p style={{ color: "var(--muted)" }}>
              Find all the hidden words. Drag across letters to select.
            </p>

            {/* Theme selector */}
            <div className="flex flex-wrap gap-2 justify-center">
              {THEMES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className="px-3 py-1.5 text-sm font-semibold rounded-lg"
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

            <button
              onClick={start}
              className="px-6 py-3 rounded-xl font-semibold"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {phase === "menu" ? "Start Game" : "Play Again"}
            </button>
          </div>
        )}
      </div>
    </GameShell>
  );
}
