import { useState, useCallback, useRef } from "react";
import { Shell } from "./components/Shell";
import { Game } from "./components/Game";
import { Leaderboard } from "./components/Leaderboard";
import { useLeaderboard } from "./hooks/useLeaderboard";
import type { GamePhase, Theme } from "./types";

const BEST_SCORE_KEY = "freewordsearch-best";
const THEMES: Theme[] = ["Animals", "Colors", "Foods", "Countries", "Sports"];

function getBestScore(): number {
  const v = localStorage.getItem(BEST_SCORE_KEY);
  return v ? parseInt(v, 10) : 0;
}

export default function App() {
  const [phase, setPhase] = useState<GamePhase>("menu");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(getBestScore);
  const [theme, setTheme] = useState<Theme>("Animals");
  const [gameKey, setGameKey] = useState(0);
  const scoreRef = useRef(0);
  const { topScores, recentScores, submitScore, loading } = useLeaderboard("wordsearch");

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
      submitScore(final);
      setPhase("over");
    },
    [submitScore],
  );

  const start = useCallback(() => {
    setScore(0);
    scoreRef.current = 0;
    setGameKey((k) => k + 1);
    setPhase("playing");
  }, []);

  return (
    <Shell
      sidebar={
        <nav className="flex-1 px-4 flex flex-col gap-3 py-4">
          <div className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
            Score
          </div>
          <div
            className="text-3xl font-bold"
            style={{ fontFamily: "Fraunces, serif" }}
          >
            {score}
          </div>
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            Best: {bestScore}
          </div>

          {/* Theme selector */}
          <div className="text-sm font-semibold mt-2" style={{ color: "var(--muted)" }}>
            Theme
          </div>
          <div className="flex flex-wrap gap-1">
            {THEMES.map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                disabled={phase === "playing"}
                className="px-3 py-1 text-xs font-semibold rounded-lg"
                style={{
                  background: theme === t ? "var(--accent)" : "transparent",
                  color: theme === t ? "#fff" : "var(--muted)",
                  opacity: phase === "playing" ? 0.5 : 1,
                  cursor: phase === "playing" ? "default" : "pointer",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {phase !== "playing" && (
            <button
              onClick={start}
              className="mt-4 px-4 py-2 rounded-xl font-semibold text-sm"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              {phase === "menu" ? "Start" : "Play Again"}
            </button>
          )}
          <div
            className="mt-2 border-t"
            style={{ borderColor: "var(--line)" }}
          >
            <div className="text-xs font-semibold px-4 pt-3" style={{ color: "var(--muted)" }}>
              Leaderboard
            </div>
            <Leaderboard topScores={topScores} recentScores={recentScores} loading={loading} />
          </div>
        </nav>
      }
      dock={
        <>
          <div className="text-sm font-semibold">
            Score: {score}
          </div>
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            Best: {bestScore}
          </div>
        </>
      }
    >
      <div className="relative w-full h-full min-h-[400px]">
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

            {/* Mobile theme selector */}
            <div className="flex flex-wrap gap-2 md:hidden justify-center">
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
    </Shell>
  );
}
