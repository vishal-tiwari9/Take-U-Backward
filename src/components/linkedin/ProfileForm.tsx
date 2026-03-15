"use client";

import { useState } from "react";
import { Loader2, Linkedin, Search, CheckCircle2, User, AlertCircle } from "lucide-react";

interface FetchedProfile {
  username: string;
  headline: string;
  about: string;
  currentRole: string;
  industry: string;
  skills: string;
  education: string;
  achievements: string;
  followerCount: number;
  fullName: string;
  location: string;
  profilePicture: string;
}

interface ProfileFormProps {
  onAnalyze: (data: Record<string, string>) => void;
  loading: boolean;
}

const experienceLevels = [
  "Student",
  "Entry Level (0-2 years)",
  "Mid Level (3-5 years)",
  "Senior Level (6-9 years)",
  "Lead / Principal (10+ years)",
  "Executive / C-Suite",
];

export function ProfileForm({ onAnalyze, loading }: ProfileFormProps) {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [fetchedProfile, setFetchedProfile] = useState<FetchedProfile | null>(null);

  const [form, setForm] = useState({
    currentRole: "",
    industry: "",
    experienceLevel: "",
    yearsOfExperience: "",
    targetRoles: "",
    headline: "",
    about: "",
    skills: "",
    education: "",
    achievements: "",
  });

  function setField(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleFetchProfile() {
    if (!linkedinUrl) return;
    setFetchLoading(true);
    setFetchError("");
    setFetchedProfile(null);

    const res = await fetch("/api/linkedin/fetch-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkedinUrl }),
    });

    const data = await res.json();

    if (!res.ok) {
      setFetchError(data.error ?? "Failed to fetch profile.");
    } else {
      const p: FetchedProfile = data.profile;
      setFetchedProfile(p);
      // Auto-populate form fields from fetched data
      setForm((prev) => ({
        ...prev,
        currentRole: p.currentRole || prev.currentRole,
        industry: p.industry || prev.industry,
        headline: p.headline || prev.headline,
        about: p.about || prev.about,
        skills: p.skills || prev.skills,
        education: p.education || prev.education,
        achievements: p.achievements || prev.achievements,
      }));
    }

    setFetchLoading(false);
  }

  function handleSubmit() {
    onAnalyze({ ...form, linkedinUrl });
  }

  const isValid =
    form.currentRole &&
    form.industry &&
    form.experienceLevel &&
    form.targetRoles &&
    form.headline &&
    form.about;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* ── Section 01: LinkedIn URL fetch ── */}
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
            marginBottom: "0.375rem",
            color: "var(--teal)",
          }}
        >
          01 — Fetch Your LinkedIn Profile
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.8375rem", marginBottom: "1.25rem" }}>
          Enter your LinkedIn URL to auto-populate your profile data.
        </p>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <Linkedin
              size={16}
              color="var(--text-muted)"
              style={{
                position: "absolute",
                left: "0.875rem",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              type="url"
              placeholder="https://linkedin.com/in/your-username"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetchProfile()}
              style={{
                width: "100%",
                padding: "0.75rem 1rem 0.75rem 2.5rem",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                color: "var(--text-primary)",
                fontSize: "0.9rem",
                outline: "none",
                fontFamily: "DM Sans, sans-serif",
              }}
            />
          </div>
          <button
            onClick={handleFetchProfile}
            disabled={!linkedinUrl || fetchLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              cursor: !linkedinUrl || fetchLoading ? "not-allowed" : "pointer",
              opacity: !linkedinUrl || fetchLoading ? 0.6 : 1,
              background: "linear-gradient(135deg, #2dd4bf, #14b8a6)",
              color: "#0d1117",
              fontWeight: 700,
              fontSize: "0.875rem",
              fontFamily: "Sora, sans-serif",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {fetchLoading ? (
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Search size={16} />
            )}
            {fetchLoading ? "Fetching..." : "Fetch Profile"}
          </button>
        </div>

        {fetchError && (
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.5rem",
              marginTop: "0.875rem",
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.25)",
              color: "#fbbf24",
              fontSize: "0.875rem",
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
            {fetchError} You can still fill in the fields below manually.
          </div>
        )}

        {/* Fetched profile preview card */}
        {fetchedProfile && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem 1.25rem",
              borderRadius: "0.75rem",
              backgroundColor: "rgba(45,212,191,0.06)",
              border: "1px solid rgba(45,212,191,0.25)",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            {fetchedProfile.profilePicture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={fetchedProfile.profilePicture}
                alt={fetchedProfile.fullName}
                style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
              />
            ) : (
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "var(--bg-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <User size={22} color="var(--text-muted)" />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: "0.9375rem", marginBottom: "0.125rem" }}>
                {fetchedProfile.fullName}
              </p>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                {fetchedProfile.location}
                {fetchedProfile.followerCount > 0 && ` · ${fetchedProfile.followerCount.toLocaleString()} followers`}
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "#2dd4bf", fontSize: "0.8125rem", fontWeight: 600 }}>
              <CheckCircle2 size={15} />
              Profile fetched
            </div>
          </div>
        )}
      </div>

      {/* ── Section 02: Role & Target ── */}
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
            color: "var(--teal)",
          }}
        >
          02 — Role & Target
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <Label>Current Role / Title <Required /></Label>
            <Input
              placeholder="Software Engineer"
              value={form.currentRole}
              onChange={(v) => setField("currentRole", v)}
              autoFilled={!!fetchedProfile?.currentRole}
            />
          </div>
          <div>
            <Label>Industry <Required /></Label>
            <Input
              placeholder="Technology / Finance / Healthcare..."
              value={form.industry}
              onChange={(v) => setField("industry", v)}
              autoFilled={!!fetchedProfile?.industry}
            />
          </div>
          <div>
            <Label>Experience Level <Required /></Label>
            <select
              value={form.experienceLevel}
              onChange={(e) => setField("experienceLevel", e.target.value)}
              style={selectStyle}
            >
              <option value="">Select level...</option>
              {experienceLevels.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Years of Experience</Label>
            <Input
              placeholder="e.g. 3"
              value={form.yearsOfExperience}
              onChange={(v) => setField("yearsOfExperience", v)}
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <Label>Target Roles <Required /></Label>
            <Input
              placeholder="e.g. Senior SWE, Full Stack Developer, Backend Engineer"
              value={form.targetRoles}
              onChange={(v) => setField("targetRoles", v)}
            />
          </div>
        </div>
      </div>

      {/* ── Section 03: Profile Content (auto-filled) ── */}
      <div
        style={{
          padding: "1.75rem",
          borderRadius: "1rem",
          backgroundColor: "var(--bg-card)",
          border: fetchedProfile ? "1px solid rgba(45,212,191,0.25)" : "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <h3
            style={{
              fontFamily: "Sora, sans-serif",
              fontWeight: 700,
              fontSize: "0.9375rem",
              color: "var(--teal)",
            }}
          >
            03 — Profile Content
          </h3>
          {fetchedProfile && (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.375rem",
                fontSize: "0.75rem",
                color: "#2dd4bf",
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={13} />
              Auto-filled from LinkedIn
            </span>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <Label>Current LinkedIn Headline <Required /></Label>
            <Input
              placeholder="Software Engineer at XYZ | React | Node.js"
              value={form.headline}
              onChange={(v) => setField("headline", v)}
              autoFilled={!!fetchedProfile?.headline}
            />
          </div>

          <div>
            <Label>About / Summary Section <Required /></Label>
            <textarea
              value={form.about}
              onChange={(e) => setField("about", e.target.value)}
              placeholder="Your LinkedIn About section will appear here after fetching..."
              rows={5}
              style={{
                ...textareaStyle,
                borderColor: fetchedProfile?.about ? "rgba(45,212,191,0.3)" : "var(--border)",
                backgroundColor: fetchedProfile?.about ? "rgba(45,212,191,0.03)" : "var(--bg-secondary)",
              }}
            />
          </div>

          <div>
            <Label>Top Skills <Optional /></Label>
            <Input
              placeholder="React, Node.js, TypeScript..."
              value={form.skills}
              onChange={(v) => setField("skills", v)}
              autoFilled={!!fetchedProfile?.skills}
            />
          </div>

          <div>
            <Label>Education <Optional /></Label>
            <Input
              placeholder="B.Tech Computer Science, XYZ University, 2023"
              value={form.education}
              onChange={(v) => setField("education", v)}
              autoFilled={!!fetchedProfile?.education}
            />
          </div>

          <div>
            <Label>Key Achievements / Projects <Optional /></Label>
            <textarea
              value={form.achievements}
              onChange={(e) => setField("achievements", e.target.value)}
              placeholder="Your top achievements or notable projects..."
              rows={4}
              style={{
                ...textareaStyle,
                borderColor: fetchedProfile?.achievements ? "rgba(45,212,191,0.3)" : "var(--border)",
                backgroundColor: fetchedProfile?.achievements ? "rgba(45,212,191,0.03)" : "var(--bg-secondary)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
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
            Analyzing with AI...
          </>
        ) : (
          <>
            <Linkedin size={18} />
            Analyze My Profile
          </>
        )}
      </button>
    </div>
  );
}

// ── Reusable sub-components ──

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
function Optional() {
  return <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: "0.8rem", marginLeft: "4px" }}>(optional)</span>;
}

function Input({
  placeholder, value, onChange, autoFilled = false,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoFilled?: boolean;
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "0.75rem 1rem",
        backgroundColor: autoFilled ? "rgba(45,212,191,0.03)" : "var(--bg-secondary)",
        border: `1px solid ${autoFilled ? "rgba(45,212,191,0.3)" : "var(--border)"}`,
        borderRadius: "0.5rem",
        color: "var(--text-primary)",
        fontSize: "0.9rem",
        outline: "none",
        fontFamily: "DM Sans, sans-serif",
        transition: "border-color 0.2s",
      }}
    />
  );
}

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
  borderRadius: "0.5rem",
  color: "var(--text-primary)",
  fontSize: "0.9rem",
  outline: "none",
  resize: "vertical",
  fontFamily: "DM Sans, sans-serif",
  lineHeight: 1.6,
  transition: "border-color 0.2s",
};