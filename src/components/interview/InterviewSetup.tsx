"use client";

import { useState } from "react";
import { Loader2, Mic } from "lucide-react";

interface SetupConfig {
  role: string;
  interviewType: string;
  difficulty: string;
  techStack: string;
  yearsOfExperience: string;
}

interface InterviewSetupProps {
  onStart: (config: SetupConfig) => void;
  loading: boolean;
}

const interviewTypes = [
  { value: "Technical", label: "Technical", desc: "Coding, algorithms, system design" },
  { value: "Behavioral", label: "Behavioral", desc: "STAR method, past experiences" },
  { value: "HR", label: "HR Round", desc: "Culture fit, motivation, goals" },
  { value: "Mixed", label: "Mixed", desc: "Combination of all types" },
];

const difficulties = [
  { value: "Entry", label: "Entry Level", desc: "0-2 years experience" },
  { value: "Mid", label: "Mid Level", desc: "3-5 years experience" },
  { value: "Senior", label: "Senior Level", desc: "6+ years experience" },
];

export function InterviewSetup({ onStart, loading }: InterviewSetupProps) {
  const [config, setConfig] = useState<SetupConfig>({
    role: "",
    interviewType: "",
    difficulty: "",
    techStack: "",
    yearsOfExperience: "",
  });

  function set(key: keyof SetupConfig, value: string) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  const isValid = config.role && config.interviewType && config.difficulty;

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Role */}
      <div style={cardStyle}>
        <h3 style={sectionHeadingStyle}>01 — Target Role</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Label>Job Role <Required /></Label>
            <input
              type="text"
              placeholder="e.g. Software Engineer, Frontend Developer, Data Scientist..."
              value={config.role}
              onChange={(e) => set("role", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <Label>Tech Stack / Domain</Label>
            <input
              type="text"
              placeholder="React, Node.js, Python, AWS..."
              value={config.techStack}
              onChange={(e) => set("techStack", e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <Label>Years of Experience</Label>
            <input
              type="text"
              placeholder="e.g. 2, 5, 8+"
              value={config.yearsOfExperience}
              onChange={(e) => set("yearsOfExperience", e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Interview Type */}
      <div style={cardStyle}>
        <h3 style={sectionHeadingStyle}>02 — Interview Type <Required /></h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          {interviewTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => set("interviewType", type.value)}
              style={{
                padding: "1rem 1.25rem",
                borderRadius: "0.75rem",
                border: `1px solid ${config.interviewType === type.value ? "var(--teal)" : "var(--border)"}`,
                backgroundColor: config.interviewType === type.value ? "rgba(45,212,191,0.08)" : "var(--bg-secondary)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <p style={{ fontWeight: 700, fontSize: "0.9rem", color: config.interviewType === type.value ? "var(--teal)" : "var(--text-primary)", marginBottom: "0.25rem" }}>
                {type.label}
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{type.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div style={cardStyle}>
        <h3 style={sectionHeadingStyle}>03 — Difficulty Level <Required /></h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
          {difficulties.map((d) => (
            <button
              key={d.value}
              onClick={() => set("difficulty", d.value)}
              style={{
                padding: "1rem",
                borderRadius: "0.75rem",
                border: `1px solid ${config.difficulty === d.value ? "var(--teal)" : "var(--border)"}`,
                backgroundColor: config.difficulty === d.value ? "rgba(45,212,191,0.08)" : "var(--bg-secondary)",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.15s",
              }}
            >
              <p style={{ fontWeight: 700, fontSize: "0.9rem", color: config.difficulty === d.value ? "var(--teal)" : "var(--text-primary)", marginBottom: "0.25rem" }}>
                {d.label}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{d.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Info card */}
      <div style={{ padding: "1rem 1.25rem", borderRadius: "0.75rem", backgroundColor: "rgba(45,212,191,0.06)", border: "1px solid rgba(45,212,191,0.2)", fontSize: "0.8375rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
        <strong style={{ color: "var(--teal)" }}>How it works:</strong> You will get 5 questions one at a time. Type your answer, submit, and receive instant AI feedback with a score. At the end you get a full performance report.
      </div>

      {/* Start */}
      <button
        onClick={() => onStart(config)}
        disabled={!isValid || loading}
        style={{
          padding: "0.9375rem",
          borderRadius: "0.75rem",
          border: "none",
          cursor: !isValid || loading ? "not-allowed" : "pointer",
          opacity: !isValid || loading ? 0.6 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.625rem",
          fontSize: "0.9375rem",
          fontWeight: 700,
          fontFamily: "Sora, sans-serif",
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          color: "#0d1117",
          transition: "all 0.2s",
        }}
      >
        {loading ? (
          <>
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            Generating Questions...
          </>
        ) : (
          <>
            <Mic size={18} />
            Start Interview
          </>
        )}
      </button>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "0.375rem" }}>
      {children}
    </label>
  );
}

function Required() {
  return <span style={{ color: "#f87171", marginLeft: "2px" }}>*</span>;
}

const cardStyle: React.CSSProperties = {
  padding: "1.75rem",
  borderRadius: "1rem",
  backgroundColor: "var(--bg-card)",
  border: "1px solid var(--border)",
};

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: "Sora, sans-serif",
  fontWeight: 700,
  fontSize: "0.9375rem",
  marginBottom: "1.25rem",
  color: "var(--teal)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  backgroundColor: "var(--bg-secondary)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  color: "var(--text-primary)",
  fontSize: "0.9rem",
  outline: "none",
  fontFamily: "DM Sans, sans-serif",
};