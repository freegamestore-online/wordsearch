import { useState, useCallback, useRef } from "react";
import { GameShell, GameTopbar, GameAuth } from "@freegamestore/games";
import { Game } from "./components/Game";
import type { Theme } from "./types";

const BEST_SCORE_KEY = "freewordsearch-best";
function getBestScore(): number {
  const v = localStorage.getItem(BEST_SCORE_KEY);
  return v ? parseInt(v, 10) : 0;
}

export default function App() {
  const [phase, setPhase] = useState<"menu" | "playing" | "over">("playing");
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(getBestScore);
  const [theme] = useState<Theme>("Animals");
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
      <div className="relative w-full h-full">
        <Game key={gameKey} theme={theme} onFinish={handleFinish} />
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
