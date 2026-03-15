"use client";

import { RotateCcw, Trophy, TrendingUp, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface Question {
  id: number;
  question: string;
  category: string;
  hint: string;
  expectedPoints: string[];
}

interface Evaluation {
  score: number;
  verdict: "excellent" | "good" | "average" | "poor";
  feedback: string;
  strengths: string[];
  improvements: string[];
  idealAnswer: string;
}

interface AnsweredQuestion {
  question: Question;
  answer: string;
  evaluation: Evaluation;
  timeTaken: number;
}

interface InterviewReportProps {
  answers: AnsweredQuestion[];
  config: { role: string; interviewType: string; difficulty: string };
  onRestart: () => void;
}

const verdictConfig = {
  excellent: { color: "#2dd4bf", bg: "rgba(45,212,191,0.1)", border: "rgba(45,212,191,0.2)", label: "Excellent" },
  good:      { color: "#22c55e", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.2)",  label: "Good" },
  average:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", label: "Average" },
  poor:      { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.2)",  label: "Poor" },
};

export function InterviewReport({ answers, config, onRestart }: InterviewReportProps) {
  const avgScore = Math.round(answers.reduce((s, a) => s + a.evaluation.score, 0) / answers.length);
  const totalTime = answers.reduce((s, a) => s + a.timeTaken, 0);
  const overallVerdict = avgScore >= 80 ? "excellent" : avgScore >= 60 ? "good" : avgScore >= 40 ? "average" : "poor";
  const vc = verdictConfig[overallVerdict];

const allStrengths = Array.from(new Set(answers.flatMap((a) => a.evaluation.strengths))).slice(0, 4);
const allImprovements = Array.from(new Set(answers.flatMap((a) => a.evaluation.improvements))).slice(0, 4);
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Overall score */}
      <div
        style={{
          padding: "2rem",
          borderRadius: "1rem",
          backgroundColor: "var(--bg-card)",
          border: `1px solid ${vc.border}`,
          boxShadow: `0 0 40px ${vc.color}12`,
          textAlign: "center",
        }}
      >
        <Trophy size={32} color={vc.color} style={{ marginBottom: "0.75rem" }} />
        <h2 style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: "1.25rem", marginBottom: "0.5rem" }}>
          Interview Complete!
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          {config.role} · {config.interviewType} · {config.difficulty} Level
        </p>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "1rem", padding: "1.25rem 2.5rem", borderRadius: "1rem", backgroundColor: vc.bg, border: `1px solid ${vc.border}`, marginBottom: "1.25rem" }}>
          <div>
            <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: "3.5rem", color: vc.color, lineHeight: 1 }}>{avgScore}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Overall Score</div>
          </div>
          <div style={{ width: "1px", height: "48px", backgroundColor: "var(--border)" }} />
          <div>
            <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1rem", color: vc.color }}>{vc.label}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Performance</div>
          </div>
          <div style={{ width: "1px", height: "48px", backgroundColor: "var(--border)" }} />
          <div>
            <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--text-primary)" }}>
              {Math.floor(totalTime / 60)}m {totalTime % 60}s
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Total Time</div>
          </div>
        </div>

        <button
          onClick={onRestart}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            borderRadius: "0.625rem",
            border: "1px solid var(--border)",
            background: "none",
            color: "var(--text-secondary)",
            fontSize: "0.875rem",
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          <RotateCcw size={14} /> Start New Interview
        </button>
      </div>

      {/* Strengths & improvements summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        <div style={{ padding: "1.5rem", borderRadius: "1rem", backgroundColor: "var(--bg-card)", border: "1px solid rgba(45,212,191,0.2)" }}>
          <h3 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#2dd4bf", marginBottom: "1rem" }}>
            ✓ Key Strengths
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {allStrengths.length > 0 ? allStrengths.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                <CheckCircle2 size={14} color="#2dd4bf" style={{ marginTop: "2px", flexShrink: 0 }} />
                {s}
              </div>
            )) : <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>No strengths identified.</p>}
          </div>
        </div>

        <div style={{ padding: "1.5rem", borderRadius: "1rem", backgroundColor: "var(--bg-card)", border: "1px solid rgba(239,68,68,0.2)" }}>
          <h3 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "0.9375rem", color: "#f87171", marginBottom: "1rem" }}>
            ✗ Areas to Improve
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            {allImprovements.length > 0 ? allImprovements.map((imp, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                <XCircle size={14} color="#f87171" style={{ marginTop: "2px", flexShrink: 0 }} />
                {imp}
              </div>
            )) : <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>No improvements noted.</p>}
          </div>
        </div>
      </div>

      {/* Per-question breakdown */}
      <div style={{ padding: "1.75rem", borderRadius: "1rem", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h3 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <TrendingUp size={18} color="var(--teal)" />
          Question Breakdown
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {answers.map((a, i) => {
            const qvc = verdictConfig[a.evaluation.verdict] ?? verdictConfig.average;
            return (
              <div key={i} style={{ padding: "1.25rem", borderRadius: "0.875rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.75rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
                      <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "0.8125rem", color: "var(--text-muted)" }}>Q{i + 1}</span>
                      <span style={{ padding: "0.15rem 0.5rem", borderRadius: "999px", backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", color: "#fbbf24", fontSize: "0.7rem", fontWeight: 700 }}>
                        {a.question.category}
                      </span>
                    </div>
                    <p style={{ fontWeight: 600, fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "0.5rem" }}>{a.question.question}</p>
                    <p style={{ fontSize: "0.8375rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{a.evaluation.feedback}</p>
                  </div>
                  <div style={{ textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: "1.5rem", color: qvc.color }}>{a.evaluation.score}</div>
                    <span style={{ padding: "0.15rem 0.5rem", borderRadius: "999px", backgroundColor: qvc.bg, border: `1px solid ${qvc.border}`, color: qvc.color, fontSize: "0.7rem", fontWeight: 700 }}>
                      {qvc.label}
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div style={{ height: "4px", backgroundColor: "var(--bg-card)", borderRadius: "2px", overflow: "hidden", marginBottom: "0.625rem" }}>
                  <div style={{ height: "100%", width: `${a.evaluation.score}%`, backgroundColor: qvc.color, borderRadius: "2px", transition: "width 0.8s ease" }} />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    <Clock size={12} />
                    {Math.floor(a.timeTaken / 60)}m {a.timeTaken % 60}s
                  </div>
                  {a.evaluation.idealAnswer && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.375rem", fontSize: "0.8rem", color: "var(--text-muted)", flex: 1 }}>
                      <AlertCircle size={12} color="var(--teal)" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <span style={{ color: "var(--text-muted)" }}>{a.evaluation.idealAnswer}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}