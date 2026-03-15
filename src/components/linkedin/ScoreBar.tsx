"use client";

interface ScoreBarProps {
  label: string;
  score: number;
  feedback: string;
}

export function ScoreBar({ label, score, feedback }: ScoreBarProps) {
  const color =
    score >= 70 ? "#2dd4bf" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "0.375rem",
        }}
      >
        <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{label}</span>
        <span
          style={{
            fontFamily: "Sora, sans-serif",
            fontWeight: 700,
            fontSize: "0.875rem",
            color,
          }}
        >
          {score}/100
        </span>
      </div>
      <div
        style={{
          height: "6px",
          backgroundColor: "var(--bg-secondary)",
          borderRadius: "3px",
          overflow: "hidden",
          marginBottom: "0.375rem",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${score}%`,
            borderRadius: "3px",
            background:
              score >= 70
                ? "linear-gradient(90deg, #2dd4bf, #14b8a6)"
                : score >= 40
                ? "linear-gradient(90deg, #f59e0b, #d97706)"
                : "linear-gradient(90deg, #ef4444, #dc2626)",
            transition: "width 0.8s ease",
          }}
        />
      </div>
      <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
        {feedback}
      </p>
    </div>
  );
}