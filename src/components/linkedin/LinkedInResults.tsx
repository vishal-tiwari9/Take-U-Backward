"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  TrendingUp,
  Lightbulb,
  Briefcase,
  Wand2,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  ArrowRight,
  Linkedin,
} from "lucide-react";
import { ScoreBar } from "./ScoreBar";

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

const verdictConfig = {
  excellent: { color: "#2dd4bf", label: "Excellent" },
  good: { color: "#22c55e", label: "Good" },
  moderate: { color: "#f59e0b", label: "Moderate" },
  weak: { color: "#ef4444", label: "Weak" },
};

const sectionLabels: Record<string, string> = {
  headline: "Headline",
  about: "About / Summary",
  experience: "Experience",
  skills: "Skills",
  education: "Education",
  completeness: "Profile Completeness",
};

const impactColor: Record<string, string> = {
  high: "#f87171",
  medium: "#fbbf24",
  low: "#2dd4bf",
};

const linkedInEditUrls: Record<string, string> = {
  headline: "https://www.linkedin.com/in/edit/intro/",
  about: "https://www.linkedin.com/in/edit/about/",
  skills: "https://www.linkedin.com/in/edit/skills/",
  education: "https://www.linkedin.com/in/edit/education/",
};

export function LinkedInResults({
  result,
  onReset,
}: {
  result: AnalysisResult;
  onReset: () => void;
}) {
  const [applyMode, setApplyMode] = useState(false);
  const config = verdictConfig[result.verdict] ?? verdictConfig.moderate;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div
        style={{
          padding: "1.75rem 2rem",
          borderRadius: "1rem",
          backgroundColor: "var(--bg-card)",
          border: `1px solid ${config.color}50`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          boxShadow: `0 0 30px ${config.color}12`,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.875rem",
              marginBottom: "0.5rem",
            }}
          >
            <span
              style={{
                fontFamily: "Sora, sans-serif",
                fontSize: "3rem",
                fontWeight: 800,
                color: config.color,
                lineHeight: 1,
              }}
            >
              {result.overallScore}
            </span>
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Profile Score
              </div>
              <span
                style={{
                  display: "inline-block",
                  padding: "0.25rem 0.75rem",
                  borderRadius: "999px",
                  backgroundColor: `${config.color}18`,
                  border: `1px solid ${config.color}40`,
                  color: config.color,
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  fontFamily: "Sora, sans-serif",
                }}
              >
                {config.label}
              </span>
            </div>
          </div>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
              maxWidth: "600px",
              lineHeight: 1.6,
            }}
          >
            {result.overallFeedback}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={() => setApplyMode(!applyMode)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.625rem 1.125rem",
              borderRadius: "0.625rem",
              border: "none",
              background: applyMode
                ? "var(--bg-secondary)"
                : "linear-gradient(135deg, #0077b5, #005885)",
              color: applyMode ? "var(--text-secondary)" : "#fff",
              fontSize: "0.875rem",
              cursor: "pointer",
              fontWeight: 600,
              fontFamily: "Sora, sans-serif",
            }}
          >
            <Linkedin size={15} />
            {applyMode ? "Hide Apply Guide" : "Apply to LinkedIn"}
          </button>
          <button
            onClick={onReset}
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
            <RotateCcw size={14} /> Analyze Again
          </button>
        </div>
      </div>

      {/* Apply to LinkedIn Guide */}
      {applyMode && (
        <div
          style={{
            padding: "1.75rem",
            borderRadius: "1rem",
            border: "1px solid rgba(0,119,181,0.4)",
            background:
              "linear-gradient(135deg, rgba(0,119,181,0.06), rgba(0,88,133,0.04))",
          }}
        >
          <h3
            style={{
              fontFamily: "Sora, sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              marginBottom: "0.375rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Linkedin size={18} color="#0077b5" />
            Apply Optimizations to LinkedIn
          </h3>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
            }}
          >
            Click{" "}
            <strong style={{ color: "var(--text-primary)" }}>Copy</strong> on
            any section, then click{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              Edit on LinkedIn
            </strong>{" "}
            to open that section directly. Paste and save.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <ApplyStep
              step={1}
              label="Update your Headline"
              content={result.linkedInPack.optimizedHeadline}
              editUrl={linkedInEditUrls.headline}
              hint="Go to your profile → click the pencil icon on your intro section → update Headline"
            />
            <ApplyStep
              step={2}
              label="Rewrite your About section"
              content={result.linkedInPack.optimizedAbout}
              editUrl={linkedInEditUrls.about}
              hint="Scroll to your About section → click the pencil icon → replace the text"
              multiline
            />
            <ApplyStep
              step={3}
              label="Add missing skills"
              content={result.linkedInPack.skillsToAdd.join(", ")}
              editUrl={linkedInEditUrls.skills}
              hint="Go to Skills section → Add a skill → type each skill below"
            />
            <ApplyStep
              step={4}
              label="Save a connection message template"
              content={result.linkedInPack.connectionMessage}
              editUrl="https://www.linkedin.com/search/results/people/"
              hint="Use this when sending connection requests to recruiters or professionals"
            />
          </div>
        </div>
      )}

      {/* Section Scores */}
      <div
        style={{
          padding: "1.75rem",
          borderRadius: "1rem",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <h3
          style={{
            fontFamily: "Sora, sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <TrendingUp size={18} color="var(--teal)" />
          Section Scores
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {Object.entries(result.sectionScores).map(([key, val]) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "1rem",
                justifyContent: "space-between",
              }}
            >
              <div style={{ flex: 1 }}>
                <ScoreBar
                  label={sectionLabels[key] ?? key}
                  score={val.score}
                  feedback={val.feedback}
                />
              </div>
              {linkedInEditUrls[key] && (
                
                  <a href={linkedInEditUrls[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    fontSize: "0.75rem",
                    color: "#0077b5",
                    textDecoration: "none",
                    fontWeight: 600,
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  Edit <ExternalLink size={11} />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
);
      {/* Strengths & Weaknesses */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}
      >
        <div
          style={{
            padding: "1.5rem",
            borderRadius: "1rem",
            backgroundColor: "var(--bg-card)",
            border: "1px solid rgba(45,212,191,0.2)",
          }}
        >
          <h3
            style={{
              fontFamily: "Sora, sans-serif",
              fontWeight: 700,
              fontSize: "0.9375rem",
              marginBottom: "1rem",
              color: "#2dd4bf",
            }}
          >
            ✓ Strengths
          </h3>
          <ul
            style={{
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "0.625rem",
            }}
          >
            {result.strengths.map((s, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                <CheckCircle2
                  size={15}
                  color="#2dd4bf"
                  style={{ marginTop: "2px", flexShrink: 0 }}
                />
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div
          style={{
            padding: "1.5rem",
            borderRadius: "1rem",
            backgroundColor: "var(--bg-card)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <h3
            style={{
              fontFamily: "Sora, sans-serif",
              fontWeight: 700,
              fontSize: "0.9375rem",
              marginBottom: "1rem",
              color: "#f87171",
            }}
          >
            ✗ Weaknesses
          </h3>
          <ul
            style={{
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: "0.625rem",
            }}
          >
            {result.weaknesses.map((w, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                <XCircle
                  size={15}
                  color="#f87171"
                  style={{ marginTop: "2px", flexShrink: 0 }}
                />
                {w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Areas of Improvement */}
      <div
        style={{
          padding: "1.75rem",
          borderRadius: "1rem",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <h3
          style={{
            fontFamily: "Sora, sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Lightbulb size={18} color="var(--teal)" />
          Areas of Improvement
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {result.areasOfImprovement.map((item, i) => (
            <div
              key={i}
              style={{
                padding: "1rem 1.25rem",
                borderRadius: "0.75rem",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                display: "flex",
                gap: "1rem",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  padding: "0.2rem 0.625rem",
                  borderRadius: "999px",
                  backgroundColor: `${impactColor[item.impact] ?? "#fbbf24"}18`,
                  border: `1px solid ${impactColor[item.impact] ?? "#fbbf24"}40`,
                  color: impactColor[item.impact] ?? "#fbbf24",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  whiteSpace: "nowrap",
                  marginTop: "2px",
                }}
              >
                {item.impact}
              </span>
              <div>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    marginBottom: "0.25rem",
                  }}
                >
                  {item.area}
                </p>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                    lineHeight: 1.5,
                  }}
                >
                  {item.action}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job Recommendations */}
      <div
        style={{
          padding: "1.75rem",
          borderRadius: "1rem",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
      >
        <h3
          style={{
            fontFamily: "Sora, sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Briefcase size={18} color="var(--teal)" />
          Job Recommendations
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "1rem",
          }}
        >
          {result.jobRecommendations.map((job, i) => (
            <div
              key={i}
              style={{
                padding: "1.25rem",
                borderRadius: "0.75rem",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "0.5rem",
                }}
              >
                <p
                  style={{
                    fontWeight: 700,
                    fontSize: "0.9375rem",
                    fontFamily: "Sora, sans-serif",
                  }}
                >
                  {job.title}
                </p>
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: job.matchScore >= 70 ? "#2dd4bf" : "#f59e0b",
                    fontFamily: "Sora, sans-serif",
                    flexShrink: 0,
                    marginLeft: "0.5rem",
                  }}
                >
                  {job.matchScore}%
                </span>
              </div>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.8125rem",
                  lineHeight: 1.5,
                  marginBottom: "0.875rem",
                }}
              >
                {job.reason}
              </p>
              <a
                href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  fontSize: "0.8125rem",
                  color: "#0077b5",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Search on LinkedIn <ArrowRight size={12} />
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* LinkedIn Pack */}
      <div
        style={{
          padding: "1.75rem",
          borderRadius: "1rem",
          border: "1px solid rgba(45,212,191,0.3)",
          background:
            "linear-gradient(135deg, rgba(45,212,191,0.04), rgba(8,145,178,0.04))",
        }}
      >
        <h3
          style={{
            fontFamily: "Sora, sans-serif",
            fontWeight: 700,
            fontSize: "1rem",
            marginBottom: "0.375rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Wand2 size={18} color="var(--teal)" />
          AI LinkedIn Pack
        </h3>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.875rem",
            marginBottom: "1.5rem",
          }}
        >
          Copy each section and paste directly into your LinkedIn profile.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <PackItem
            label="Optimized Headline"
            content={result.linkedInPack.optimizedHeadline}
            editUrl={linkedInEditUrls.headline}
          />
          <PackItem
            label="Optimized About Section"
            content={result.linkedInPack.optimizedAbout}
            editUrl={linkedInEditUrls.about}
            multiline
          />
          <PackItem
            label="Connection Request Message"
            content={result.linkedInPack.connectionMessage}
            editUrl="https://www.linkedin.com/search/results/people/"
          />
          <PackItem
            label="Featured Section Idea"
            content={result.linkedInPack.featuredSectionIdea}
            editUrl="https://www.linkedin.com/in/edit/featured/"
          />

          <div>
            <p
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: "0.625rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Skills to Add
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                marginBottom: "0.75rem",
              }}
            >
              {result.linkedInPack.skillsToAdd.map((skill) => (
                <span
                  key={skill}
                  style={{
                    padding: "0.375rem 0.875rem",
                    borderRadius: "999px",
                    backgroundColor: "rgba(45,212,191,0.1)",
                    border: "1px solid rgba(45,212,191,0.25)",
                    color: "#2dd4bf",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  + {skill}
                </span>
              ))}
            </div>
            <a
              href={linkedInEditUrls.skills}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.8125rem",
                color: "#0077b5",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              <ExternalLink size={13} /> Add skills on LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplyStep({
  step,
  label,
  content,
  editUrl,
  hint,
  multiline = false,
}: {
  step: number;
  label: string;
  content: string;
  editUrl: string;
  hint: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      style={{
        padding: "1.25rem",
        borderRadius: "0.75rem",
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0077b5, #005885)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Sora, sans-serif",
            fontWeight: 700,
            fontSize: "0.8125rem",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {step}
        </div>
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontWeight: 700,
              fontSize: "0.9375rem",
              marginBottom: "0.25rem",
            }}
          >
            {label}
          </p>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.8rem",
              marginBottom: "0.875rem",
            }}
          >
            {hint}
          </p>
          <div
            style={{
              padding: "0.875rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              fontSize: "0.875rem",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              whiteSpace: multiline ? "pre-wrap" : "normal",
              marginBottom: "0.875rem",
              maxHeight: multiline ? "160px" : "auto",
              overflowY: multiline ? "auto" : "visible",
            }}
          >
            {content}
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={handleCopy}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--border)",
                background: copied ? "rgba(45,212,191,0.1)" : "var(--bg-card)",
                color: copied ? "#2dd4bf" : "var(--text-secondary)",
                fontSize: "0.8125rem",
                cursor: "pointer",
                fontWeight: 600,
                transition: "all 0.15s",
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy"}
            </button>
            
              <a href={editUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.375rem",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                background: "linear-gradient(135deg, #0077b5, #005885)",
                color: "#fff",
                fontSize: "0.8125rem",
                fontWeight: 600,
                textDecoration: "none",
                fontFamily: "Sora, sans-serif",
              }}
            >
              <ExternalLink size={14} /> Edit on LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function PackItem({
  label,
  content,
  editUrl,
  multiline = false,
}: {
  label: string;
  content: string;
  editUrl: string;
  multiline?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{
        borderRadius: "0.75rem",
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.75rem 1rem",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </span>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handleCopy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.375rem 0.75rem",
              borderRadius: "0.375rem",
              border: "1px solid var(--border)",
              background: copied ? "rgba(45,212,191,0.1)" : "none",
              color: copied ? "#2dd4bf" : "var(--text-muted)",
              fontSize: "0.8rem",
              cursor: "pointer",
              fontWeight: 500,
              transition: "all 0.15s",
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy"}
          </button>
          
            <a href={editUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.375rem 0.75rem",
              borderRadius: "0.375rem",
              background: "linear-gradient(135deg, #0077b5, #005885)",
              color: "#fff",
              fontSize: "0.8rem",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <ExternalLink size={12} /> Edit on LinkedIn
          </a>
        </div>
      </div>
      <p
        style={{
          padding: "1rem",
          fontSize: "0.9rem",
          color: "var(--text-secondary)",
          lineHeight: 1.7,
          whiteSpace: multiline ? "pre-wrap" : "normal",
        }}
      >
        {content}
      </p>
    </div>
  );
}