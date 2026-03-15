"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  RotateCcw,
  Star,
  Tag,
  TrendingUp,
  FileText,
  Linkedin,
  Globe,
  Lightbulb,
  ChevronRight,
} from "lucide-react";

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

export function ProjectResults({
  result,
  onReset,
}: {
  result: RewriteResult;
  onReset: () => void;
}) {
  const scoreColor =
    result.strengthScore >= 70
      ? "#2dd4bf"
      : result.strengthScore >= 40
      ? "#f59e0b"
      : "#ef4444";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Header */}
      <div
        style={{
          padding: "1.75rem 2rem",
          borderRadius: "1rem",
          backgroundColor: "var(--bg-card)",
          border: `1px solid ${scoreColor}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          boxShadow: `0 0 30px ${scoreColor}10`,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "Sora, sans-serif",
              fontWeight: 800,
              fontSize: "1.375rem",
              marginBottom: "0.375rem",
            }}
          >
            {result.projectName}
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9375rem",
              fontStyle: "italic",
              marginBottom: "0.875rem",
              maxWidth: "600px",
            }}
          >
            &ldquo;{result.oneLiner}&rdquo;
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Star size={16} color={scoreColor} fill={scoreColor} />
              <span
                style={{
                  fontFamily: "Sora, sans-serif",
                  fontWeight: 800,
                  fontSize: "1.25rem",
                  color: scoreColor,
                }}
              >
                {result.strengthScore}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                / 100 strength score
              </span>
            </div>
          </div>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.8375rem",
              marginTop: "0.375rem",
              maxWidth: "560px",
            }}
          >
            {result.strengthFeedback}
          </p>
        </div>
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
            flexShrink: 0,
          }}
        >
          <RotateCcw size={14} /> Rewrite Another
        </button>
      </div>

      {/* Resume Bullets */}
      <CopyCard
        icon={<FileText size={18} color="var(--teal)" />}
        title="Resume Bullets"
        subtitle="Paste directly into your resume under this project"
        content={result.resumeBullets.map((b) => `• ${b}`).join("\n")}
        renderContent={() => (
          <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {result.resumeBullets.map((bullet, i) => (
              <li
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.625rem",
                  fontSize: "0.9375rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.65,
                }}
              >
                <ChevronRight
                  size={16}
                  color="var(--teal)"
                  style={{ marginTop: "3px", flexShrink: 0 }}
                />
                {bullet}
              </li>
            ))}
          </ul>
        )}
      />

      {/* LinkedIn Description */}
      <CopyCard
        icon={<Linkedin size={18} color="#0077b5" />}
        title="LinkedIn Description"
        subtitle="For your LinkedIn Featured section or experience description"
        content={result.linkedInDescription}
        multiline
        renderContent={() => (
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9375rem",
              lineHeight: 1.75,
            }}
          >
            {result.linkedInDescription}
          </p>
        )}
      />

      {/* Portfolio Description */}
      <CopyCard
        icon={<Globe size={18} color="#8b5cf6" />}
        title="Portfolio Description"
        subtitle="Rich description for your portfolio website or GitHub README"
        content={result.portfolioDescription}
        multiline
        renderContent={() => (
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.9375rem",
              lineHeight: 1.75,
              whiteSpace: "pre-wrap",
            }}
          >
            {result.portfolioDescription}
          </p>
        )}
      />

      {/* Tech Highlights + Keywords */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
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
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <TrendingUp size={16} color="var(--teal)" />
            Tech Highlights
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {result.techHighlights.map((tech) => (
              <span
                key={tech}
                style={{
                  padding: "0.375rem 0.75rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(45,212,191,0.08)",
                  border: "1px solid rgba(45,212,191,0.2)",
                  color: "#2dd4bf",
                  fontSize: "0.8375rem",
                  fontWeight: 500,
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

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
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Tag size={16} color="var(--teal)" />
            ATS Keywords
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {result.keywords.map((kw) => (
              <span
                key={kw}
                style={{
                  padding: "0.375rem 0.75rem",
                  borderRadius: "0.5rem",
                  backgroundColor: "rgba(139,92,246,0.08)",
                  border: "1px solid rgba(139,92,246,0.2)",
                  color: "#a78bfa",
                  fontSize: "0.8375rem",
                  fontWeight: 500,
                }}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Suggested Metrics */}
      <div
        style={{
          padding: "1.5rem",
          borderRadius: "1rem",
          backgroundColor: "var(--bg-card)",
          border: "1px solid rgba(245,158,11,0.25)",
          background: "linear-gradient(135deg, rgba(245,158,11,0.04), transparent)",
        }}
      >
        <h3
          style={{
            fontFamily: "Sora, sans-serif",
            fontWeight: 700,
            fontSize: "0.9375rem",
            marginBottom: "0.375rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "#fbbf24",
          }}
        >
          <TrendingUp size={16} />
          Suggested Metrics to Add
        </h3>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.8125rem",
            marginBottom: "1rem",
          }}
        >
          These are realistic metrics you can verify and add to strengthen your project.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {result.suggestedMetrics.map((metric, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: "#fbbf24",
                  flexShrink: 0,
                }}
              />
              {metric}
            </div>
          ))}
        </div>
      </div>

      {/* Improvements */}
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
            fontSize: "0.9375rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <Lightbulb size={16} color="var(--teal)" />
          How to Make This Project Stronger
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {result.improvements.map((item, i) => (
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
                  backgroundColor: "rgba(45,212,191,0.1)",
                  border: "1px solid rgba(45,212,191,0.25)",
                  color: "#2dd4bf",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  whiteSpace: "nowrap",
                  marginTop: "2px",
                  flexShrink: 0,
                }}
              >
                {item.area}
              </span>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                }}
              >
                {item.suggestion}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CopyCard({
  icon,
  title,
  subtitle,
  content,
  multiline = false,
  renderContent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  content: string;
  multiline?: boolean;
  renderContent: () => React.ReactNode;
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
        borderRadius: "1rem",
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 1.5rem",
          borderBottom: "1px solid var(--border)",
          backgroundColor: "var(--bg-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
          {icon}
          <div>
            <p
              style={{
                fontFamily: "Sora, sans-serif",
                fontWeight: 700,
                fontSize: "0.9375rem",
                lineHeight: 1.2,
              }}
            >
              {title}
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {subtitle}
            </p>
          </div>
        </div>
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
            color: copied ? "#2dd4bf" : "var(--text-muted)",
            fontSize: "0.8125rem",
            cursor: "pointer",
            fontWeight: 600,
            transition: "all 0.15s",
            flexShrink: 0,
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div style={{ padding: "1.5rem" }}>{renderContent()}</div>
    </div>
  );
}