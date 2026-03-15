"use client";

import { useState } from "react";
import { FileText, History, ChevronRight, RotateCcw } from "lucide-react";
import { UploadZone } from "@/components/resume/UploadZone";
import { ResultsPanel } from "@/components/resume/ResultPanel";

interface AnalysisResult {
  atsScore: number;
  overallFeedback: string;
  verdict: "strong" | "moderate" | "weak";
  sections: Record<string, { score: number; status: string; feedback: string }>;
  keywords: { found: string[]; missing: string[] };
  improvements: { priority: string; title: string; description: string }[];
  strengths: string[];
}

export default function ResumeReportPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [fileName, setFileName] = useState("");

  async function handleAnalyze(file: File, jobDescription: string) {
    setLoading(true);
    setError("");
    setResult(null);
    setFileName(file.name);

    const formData = new FormData();
    formData.append("resume", file);
    if (jobDescription) formData.append("jobDescription", jobDescription);

    const res = await fetch("/api/resume/analyze", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
    } else {
      setResult(data.result);
    }

    setLoading(false);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileText size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: "1.625rem", fontWeight: 800 }}>
              Resume Scoring
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              ATS compatibility analysis powered by Groq AI
            </p>
          </div>
        </div>

        {result && (
          <button
            onClick={() => { setResult(null); setError(""); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1rem",
              borderRadius: "0.625rem",
              border: "1px solid var(--border)",
              background: "none",
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            <RotateCcw size={15} />
            Analyze Another
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            padding: "0.875rem 1.25rem",
            borderRadius: "0.75rem",
            backgroundColor: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171",
            fontSize: "0.9rem",
            marginBottom: "1.5rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Main content */}
      {result ? (
        <ResultsPanel result={result} fileName={fileName} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem", alignItems: "start" }}>
          {/* Upload zone */}
          <div
            style={{
              padding: "1.75rem",
              borderRadius: "1rem",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <h2
              style={{
                fontFamily: "Sora, sans-serif",
                fontWeight: 700,
                fontSize: "1rem",
                marginBottom: "1.25rem",
              }}
            >
              Upload Your Resume
            </h2>
            <UploadZone onAnalyze={handleAnalyze} loading={loading} />
          </div>

          {/* What we check sidebar */}
          <div
            style={{
              padding: "1.5rem",
              borderRadius: "1rem",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
            }}
          >
            <h3
              style={{
                fontFamily: "Sora, sans-serif",
                fontWeight: 700,
                fontSize: "0.9375rem",
                marginBottom: "1rem",
              }}
            >
              What we analyze
            </h3>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {checks.map((c) => (
                <li
                  key={c}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.625rem",
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  <ChevronRight size={14} color="var(--teal)" />
                  {c}
                </li>
              ))}
            </ul>

            <div
              style={{
                marginTop: "1.5rem",
                padding: "0.875rem",
                borderRadius: "0.625rem",
                backgroundColor: "var(--teal-glow)",
                border: "1px solid rgba(45,212,191,0.2)",
              }}
            >
              <p style={{ fontSize: "0.8rem", color: "var(--teal)", fontWeight: 500, lineHeight: 1.6 }}>
                💡 Tip: Paste a job description for keyword-matched, role-specific feedback.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const checks = [
  "ATS compatibility score (0–100)",
  "Contact information completeness",
  "Professional summary quality",
  "Work experience impact",
  "Education formatting",
  "Skills section relevance",
  "Keyword detection & gaps",
  "Formatting & readability",
  "Actionable improvement plan",
];
