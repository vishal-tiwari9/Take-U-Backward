"use client";

import { useState } from "react";
import { Code2 } from "lucide-react";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ProjectResults } from "@/components/projects/ProjectResults";

interface RewriteResult {
  projectName: string;
  oneLiner: string;
  resumeBullets: string[];
  linkedInDescription: string;
  portfolioDescription: string;
  techHighlights: string[];
  suggestedMetrics: string[];
  improvements: { area: string; suggestion: string }[];
  keywords: string[];
  strengthScore: number;
  strengthFeedback: string;
}

export default function ProjectRewritePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<RewriteResult | null>(null);

  async function handleRewrite(formData: Record<string, string>) {
    setLoading(true);
    setError("");
    setResult(null);

    const res = await fetch("/api/projects/rewrite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
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
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Code2 size={22} color="#fff" />
          </div>
          <div>
            <h1
              style={{
                fontFamily: "Sora, sans-serif",
                fontSize: "1.625rem",
                fontWeight: 800,
              }}
            >
              Project Rewriter
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Transform your projects into ATS-optimized resume bullets, LinkedIn posts & portfolio descriptions
            </p>
          </div>
        </div>
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

      {result ? (
        <ProjectResults result={result} onReset={() => setResult(null)} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem", alignItems: "start" }}>
          <ProjectForm onRewrite={handleRewrite} loading={loading} />

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div
              style={{
                padding: "1.25rem",
                borderRadius: "1rem",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <h3
                style={{
                  fontFamily: "Sora, sans-serif",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  marginBottom: "0.875rem",
                  color: "var(--teal)",
                }}
              >
                What you&apos;ll get
              </h3>
              {[
                "3 ATS-optimized resume bullets",
                "LinkedIn featured section copy",
                "Portfolio website description",
                "ATS keyword suggestions",
                "Suggested metrics to add",
                "Project strength score",
                "Improvement recommendations",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.8375rem",
                    color: "var(--text-secondary)",
                    marginBottom: "0.5rem",
                  }}
                >
                  <span style={{ color: "#2dd4bf", fontWeight: 700 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>

            <div
              style={{
                padding: "1.25rem",
                borderRadius: "1rem",
                backgroundColor: "rgba(139,92,246,0.06)",
                border: "1px solid rgba(139,92,246,0.2)",
              }}
            >
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                💡 <strong style={{ color: "var(--text-primary)" }}>Tip:</strong> The more detail you provide about your impact and what you built, the stronger and more specific the output will be.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
