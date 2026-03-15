"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, XCircle, TrendingUp, Tag, Lightbulb, Wand2, Loader2, Download } from "lucide-react";
import { ScoreRing } from "./ScoreRing";

interface AnalysisResult {
  atsScore: number;
  overallFeedback: string;
  verdict: "strong" | "moderate" | "weak";
  sections: Record<string, { score: number; status: string; feedback: string }>;
  keywords: { found: string[]; missing: string[] };
  improvements: { priority: string; title: string; description: string }[];
  strengths: string[];
}

const statusIcon = {
  good:    <CheckCircle2 size={16} color="#2dd4bf" />,
  warning: <AlertCircle  size={16} color="#f59e0b" />,
  missing: <XCircle      size={16} color="#ef4444" />,
};

const priorityColor = {
  high:   { bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)",   text: "#f87171", label: "High" },
  medium: { bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)",  text: "#fbbf24", label: "Medium" },
  low:    { bg: "rgba(45,212,191,0.1)",  border: "rgba(45,212,191,0.25)",  text: "#2dd4bf", label: "Low" },
};

const sectionLabels: Record<string, string> = {
  contactInfo: "Contact Info",
  summary:     "Professional Summary",
  experience:  "Work Experience",
  education:   "Education",
  skills:      "Skills",
  formatting:  "Formatting",
};

export function ResultsPanel({ result, fileName }: { result: AnalysisResult; fileName: string }) {
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState("");

  async function handleOptimize() {
    setOptimizing(true);
    setOptimizeError("");

    try {
      const res = await fetch("/api/resume/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeData: result }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Optimization failed");
      }

      // Handle binary PDF response → trigger browser download
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `optimized-resume-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setOptimizeError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setOptimizing(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* ── Score + Overview ── */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "1.5rem", alignItems: "start" }}>
        <div
          style={{
            padding: "1.75rem",
            borderRadius: "1rem",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
            textAlign: "center",
          }}
        >
          <ScoreRing score={result.atsScore} verdict={result.verdict} />
          <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--text-muted)", wordBreak: "break-word" }}>
            {fileName}
          </p>
        </div>

        <div
          style={{
            padding: "1.75rem",
            borderRadius: "1rem",
            backgroundColor: "var(--bg-card)",
            border: "1px solid var(--border)",
          }}
        >
          <h3 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1rem", marginBottom: "0.875rem" }}>
            Overall Feedback
          </h3>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.9375rem", marginBottom: "1.5rem" }}>
            {result.overallFeedback}
          </p>

          <h4 style={{ fontFamily: "Sora, sans-serif", fontWeight: 600, fontSize: "0.875rem", marginBottom: "0.625rem", color: "var(--teal)" }}>
            ✓ Strengths
          </h4>
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.375rem" }}>
            {result.strengths.map((s, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                <CheckCircle2 size={15} color="#2dd4bf" style={{ marginTop: "2px", flexShrink: 0 }} />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Section Breakdown ── */}
      <div style={{ padding: "1.75rem", borderRadius: "1rem", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h3 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <TrendingUp size={18} color="var(--teal)" />
          Section Breakdown
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {Object.entries(result.sections).map(([key, section]) => (
            <div key={key}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.375rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.9rem", fontWeight: 500 }}>
                  {statusIcon[section.status as keyof typeof statusIcon] ?? statusIcon.warning}
                  {sectionLabels[key] ?? key}
                </div>
                <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "0.875rem", color: section.score >= 70 ? "#2dd4bf" : section.score >= 40 ? "#f59e0b" : "#ef4444" }}>
                  {section.score}/100
                </span>
              </div>
              <div style={{ height: "6px", backgroundColor: "var(--bg-secondary)", borderRadius: "3px", overflow: "hidden", marginBottom: "0.375rem" }}>
                <div style={{ height: "100%", width: `${section.score}%`, borderRadius: "3px", background: section.score >= 70 ? "linear-gradient(90deg, #2dd4bf, #14b8a6)" : section.score >= 40 ? "linear-gradient(90deg, #f59e0b, #d97706)" : "linear-gradient(90deg, #ef4444, #dc2626)", transition: "width 0.8s ease" }} />
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{section.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Keywords ── */}
      <div style={{ padding: "1.75rem", borderRadius: "1rem", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h3 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Tag size={18} color="var(--teal)" />
          Keywords
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          <div>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#2dd4bf", marginBottom: "0.625rem" }}>
              ✓ Found ({result.keywords.found.length})
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {result.keywords.found.map((kw) => (
                <span key={kw} style={{ padding: "0.25rem 0.625rem", borderRadius: "999px", backgroundColor: "rgba(45,212,191,0.1)", border: "1px solid rgba(45,212,191,0.25)", color: "#2dd4bf", fontSize: "0.8rem" }}>
                  {kw}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#ef4444", marginBottom: "0.625rem" }}>
              ✗ Missing ({result.keywords.missing.length})
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
              {result.keywords.missing.map((kw) => (
                <span key={kw} style={{ padding: "0.25rem 0.625rem", borderRadius: "999px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171", fontSize: "0.8rem" }}>
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Improvements ── */}
      <div style={{ padding: "1.75rem", borderRadius: "1rem", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <h3 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Lightbulb size={18} color="var(--teal)" />
          Improvement Suggestions
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {result.improvements.map((item, i) => {
            const p = priorityColor[item.priority as keyof typeof priorityColor] ?? priorityColor.medium;
            return (
              <div key={i} style={{ padding: "1rem 1.25rem", borderRadius: "0.75rem", backgroundColor: p.bg, border: `1px solid ${p.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem" }}>
                  <span style={{ padding: "0.125rem 0.5rem", borderRadius: "999px", backgroundColor: `${p.text}20`, color: p.text, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {p.label}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{item.title}</span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Optimize Resume CTA ── */}
      <div
        style={{
          padding: "2rem",
          borderRadius: "1rem",
          backgroundColor: "var(--bg-card)",
          border: "1px solid rgba(45,212,191,0.25)",
          background: "linear-gradient(135deg, rgba(45,212,191,0.05), rgba(8,145,178,0.05))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1.0625rem", marginBottom: "0.375rem" }}>
            Ready to level up your resume?
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Let AI rewrite and optimize your resume, then download it as a polished PDF instantly.
          </p>
          {optimizeError && (
            <p style={{ color: "#f87171", fontSize: "0.875rem", marginTop: "0.5rem" }}>
              ⚠ {optimizeError}
            </p>
          )}
        </div>

        <button
          onClick={handleOptimize}
          disabled={optimizing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.625rem",
            padding: "0.875rem 1.75rem",
            borderRadius: "0.75rem",
            border: "none",
            cursor: optimizing ? "not-allowed" : "pointer",
            opacity: optimizing ? 0.7 : 1,
            background: "linear-gradient(135deg, #2dd4bf, #14b8a6)",
            color: "#0d1117",
            fontSize: "0.9375rem",
            fontWeight: 700,
            fontFamily: "Sora, sans-serif",
            whiteSpace: "nowrap",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
        >
          {optimizing ? (
            <>
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
              Generating PDF...
            </>
          ) : (
            <>
              <Wand2 size={18} />
              Optimize Resume
              <Download size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}