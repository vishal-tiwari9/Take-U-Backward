"use client";

import { useEffect, useState } from "react";

interface ScoreRingProps {
  score: number;
  verdict: "strong" | "moderate" | "weak";
}

const verdictConfig = {
  strong:   { label: "Strong",   color: "#2dd4bf" },
  moderate: { label: "Moderate", color: "#f59e0b" },
  weak:     { label: "Weak",     color: "#ef4444" },
};

export function ScoreRing({ score, verdict }: ScoreRingProps) {
  const [displayed, setDisplayed] = useState(0);
  const config = verdictConfig[verdict];
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayed / 100) * circumference;

  useEffect(() => {
    let start = 0;
    const step = score / 60; // animate over ~60 frames
    const timer = setInterval(() => {
      start += step;
      if (start >= score) {
        setDisplayed(score);
        clearInterval(timer);
      } else {
        setDisplayed(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [score]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
      <svg width="180" height="180" style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth="10"
        />
        {/* Progress */}
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke={config.color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.016s linear", filter: `drop-shadow(0 0 8px ${config.color}60)` }}
        />
      </svg>
      {/* Centered text overlay */}
      <div style={{ marginTop: "-150px", textAlign: "center", zIndex: 1 }}>
        <div
          style={{
            fontFamily: "Sora, sans-serif",
            fontSize: "2.5rem",
            fontWeight: 800,
            color: config.color,
            lineHeight: 1,
          }}
        >
          {displayed}
        </div>
        <div style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
          ATS Score
        </div>
      </div>
      <div style={{ marginTop: "5rem" }}>
        <span
          style={{
            display: "inline-block",
            padding: "0.375rem 1rem",
            borderRadius: "999px",
            backgroundColor: `${config.color}18`,
            border: `1px solid ${config.color}40`,
            color: config.color,
            fontSize: "0.875rem",
            fontWeight: 700,
            fontFamily: "Sora, sans-serif",
          }}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}