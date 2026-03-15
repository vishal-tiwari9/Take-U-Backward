"use client";

import { useState } from "react";
import { Loader2, Wand2 } from "lucide-react";

interface ProjectFormProps {
  onRewrite: (data: Record<string, string>) => void;
  loading: boolean;
}

const projectTypes = [
  "Web Application",
  "Mobile App",
  "API / Backend Service",
  "CLI Tool",
  "Machine Learning / AI",
  "Data Pipeline",
  "DevOps / Infrastructure",
  "Open Source Library",
  "Chrome Extension",
  "Other",
];

const teamSizes = ["Solo", "2-3 people", "4-6 people", "7-10 people", "10+ people"];

export function ProjectForm({ onRewrite, loading }: ProjectFormProps) {
  const [form, setForm] = useState({
    projectName: "",
    projectType: "",
    techStack: "",
    yourRole: "",
    teamSize: "",
    duration: "",
    problemSolved: "",
    whatYouBuilt: "",
    impact: "",
    targetRole: "",
  });

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const isValid = form.projectName && form.whatYouBuilt && form.techStack;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Section 01 */}
      <div style={cardStyle}>
        <h3 style={sectionHeadingStyle}>01 — Project Basics</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <Label>Project Name <Required /></Label>
            <Input
              placeholder="e.g. TalentOS, Portfolio Tracker, Chat App"
              value={form.projectName}
              onChange={(v) => set("projectName", v)}
            />
          </div>
          <div>
            <Label>Project Type</Label>
            <select
              value={form.projectType}
              onChange={(e) => set("projectType", e.target.value)}
              style={selectStyle}
            >
              <option value="">Select type...</option>
              {projectTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Tech Stack <Required /></Label>
            <Input
              placeholder="React, Node.js, PostgreSQL, AWS..."
              value={form.techStack}
              onChange={(v) => set("techStack", v)}
            />
          </div>
          <div>
            <Label>Your Role</Label>
            <Input
              placeholder="Full Stack Developer, Backend Lead..."
              value={form.yourRole}
              onChange={(v) => set("yourRole", v)}
            />
          </div>
          <div>
            <Label>Team Size</Label>
            <select
              value={form.teamSize}
              onChange={(e) => set("teamSize", e.target.value)}
              style={selectStyle}
            >
              <option value="">Select team size...</option>
              {teamSizes.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <Label>Duration</Label>
            <Input
              placeholder="e.g. 3 months, 2 weeks, ongoing..."
              value={form.duration}
              onChange={(v) => set("duration", v)}
            />
          </div>
        </div>
      </div>

      {/* Section 02 */}
      <div style={cardStyle}>
        <h3 style={sectionHeadingStyle}>02 — Project Details</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <Label>Problem You Solved</Label>
            <textarea
              value={form.problemSolved}
              onChange={(e) => set("problemSolved", e.target.value)}
              placeholder="What problem does this project solve? Who was it for?"
              rows={3}
              style={textareaStyle}
            />
          </div>
          <div>
            <Label>What You Built <Required /></Label>
            <textarea
              value={form.whatYouBuilt}
              onChange={(e) => set("whatYouBuilt", e.target.value)}
              placeholder="Describe what you built, the key features, and technical decisions you made..."
              rows={4}
              style={textareaStyle}
            />
          </div>
          <div>
            <Label>Impact / Results</Label>
            <textarea
              value={form.impact}
              onChange={(e) => set("impact", e.target.value)}
              placeholder="Any metrics, user counts, performance improvements, or business outcomes? (Even rough estimates help)"
              rows={3}
              style={textareaStyle}
            />
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              💡 Don&apos;t worry if you don&apos;t have exact metrics — our AI will suggest realistic ones you can use.
            </p>
          </div>
        </div>
      </div>

      {/* Section 03 */}
      <div style={cardStyle}>
        <h3 style={sectionHeadingStyle}>03 — Target Context</h3>
        <div>
          <Label>Target Role / Job</Label>
          <Input
            placeholder="e.g. Senior Software Engineer, Full Stack Developer, Backend Engineer"
            value={form.targetRole}
            onChange={(v) => set("targetRole", v)}
          />
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
            Helps tailor the language and keywords for your target job.
          </p>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={() => onRewrite(form)}
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
          background: "linear-gradient(135deg, #2dd4bf, #14b8a6)",
          color: "#0d1117",
          transition: "all 0.2s",
        }}
      >
        {loading ? (
          <>
            <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            Rewriting with AI...
          </>
        ) : (
          <>
            <Wand2 size={18} />
            Rewrite Project
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

function Input({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "0.75rem 1rem",
        backgroundColor: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: "0.5rem",
        color: "var(--text-primary)",
        fontSize: "0.9rem",
        outline: "none",
        fontFamily: "DM Sans, sans-serif",
      }}
    />
  );
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

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  backgroundColor: "var(--bg-secondary)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  color: "var(--text-primary)",
  fontSize: "0.9rem",
  outline: "none",
  cursor: "pointer",
  fontFamily: "DM Sans, sans-serif",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.75rem 1rem",
  backgroundColor: "var(--bg-secondary)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  color: "var(--text-primary)",
  fontSize: "0.9rem",
  outline: "none",
  resize: "vertical",
  fontFamily: "DM Sans, sans-serif",
  lineHeight: 1.6,
};