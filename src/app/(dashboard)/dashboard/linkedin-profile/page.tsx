"use client";

import { useState } from "react";
import { Linkedin } from "lucide-react";
import { ProfileForm } from "@/components/linkedin/ProfileForm";
import { LinkedInResults } from "@/components/linkedin/LinkedInResults";

interface AnalysisResult {
  overallScore: number;
  verdict: "excellent" | "good" | "moderate" | "weak";
  overallFeedback: string;
  sectionScores: Record<string, { score: number; feedback: string }>;
  strengths: string[];
  weaknesses: string[];
  areasOfImprovement: { area: string; action: string; impact: string }[];
  jobRecommendations: { title: string; reason: string; matchScore: number }[];
  linkedInPack: {
    optimizedHeadline: string;
    optimizedAbout: string;
    skillsToAdd: string[];
    connectionMessage: string;
    featuredSectionIdea: string;
  };
}

export default function LinkedInProfilePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  async function handleAnalyze(formData: Record<string, string>) {
    setLoading(true);
    setError("");
    setResult(null);

    const res = await fetch("/api/linkedin/analyze", {
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
              background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Linkedin size={22} color="#fff" />
          </div>
          <div>
            <h1
              style={{
                fontFamily: "Sora, sans-serif",
                fontSize: "1.625rem",
                fontWeight: 800,
              }}
            >
              LinkedIn Optimization
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Profile analysis, section scoring & AI optimization pack
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
        <LinkedInResults result={result} onReset={() => setResult(null)} />
      ) : (
        <ProfileForm onAnalyze={handleAnalyze} loading={loading} />
      )}
    </div>
  );
}
