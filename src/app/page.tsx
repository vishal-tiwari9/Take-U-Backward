"use client";

import Link from "next/link";
import {
  GraduationCap,
  Moon,
  ArrowRight,
  FileText,
  Linkedin,
  Wand2,
  Mic,
  CheckCircle2,
  Zap,
  Shield,
  BarChart3,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      {/* ── Navbar ── */}
      <nav
        style={{
          borderBottom: "1px solid var(--border-subtle)",
          backgroundColor: "rgba(13,17,23,0.8)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "0 1.5rem",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #2dd4bf, #0891b2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GraduationCap size={20} color="#0d1117" strokeWidth={2.5} />
            </div>
            <span
              style={{
                fontFamily: "Sora, sans-serif",
                fontWeight: 700,
                fontSize: "1.125rem",
                color: "var(--text-primary)",
              }}
            >
              APEX
            </span>
          </div>

          {/* Nav actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Moon size={18} />
            </button>
            <Link
              href="/login"
              style={{
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 500,
                fontSize: "0.9375rem",
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--border)",
                transition: "all 0.15s",
              }}
            >
              Log In
            </Link>
            <Link
              href="/register"
              style={{
                textDecoration: "none",
                padding: "0.5rem 1.25rem",
                borderRadius: "0.5rem",
                fontSize: "0.9375rem",
                fontWeight: 600,
                fontFamily: "Sora, sans-serif",
              }}
              className="btn-primary"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          minHeight: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "4rem 1.5rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow blobs */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "600px",
            background:
              "radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.375rem 1rem",
            borderRadius: "999px",
            border: "1px solid rgba(45,212,191,0.4)",
            background: "rgba(45,212,191,0.07)",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--teal)",
            marginBottom: "2rem",
            fontFamily: "Sora, sans-serif",
          }}
        >
          <Zap size={14} />
          AI-powered placement preparation
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "Sora, sans-serif",
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: "1.5rem",
            maxWidth: "900px",
          }}
        >
          Your Complete{" "}
          <span className="gradient-text">Placement Pipeline</span>
        </h1>

        {/* Subtext */}
        <p
          style={{
            fontSize: "clamp(1rem, 2vw, 1.25rem)",
            color: "var(--text-secondary)",
            maxWidth: "600px",
            lineHeight: 1.7,
            marginBottom: "2.5rem",
          }}
        >
          From ATS-optimized resumes to interview prep—everything you need to
          land your dream job, powered by AI.
        </p>

        {/* CTA */}
        <Link
          href="/register"
          style={{
            textDecoration: "none",
            padding: "0.875rem 2rem",
            borderRadius: "0.75rem",
            fontSize: "1rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
          className="btn-primary"
        >
          Start Your Journey <ArrowRight size={18} />
        </Link>
      </section>

      {/* ── Features ── */}
      <section
        style={{
          padding: "6rem 1.5rem",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <h2
            style={{
              fontFamily: "Sora, sans-serif",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            Everything you need to get placed
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.0625rem" }}>
            Four powerful AI modules, one unified platform.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {features.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* ── Why TalentOS ── */}
      <section
        style={{
          padding: "5rem 1.5rem",
          backgroundColor: "var(--bg-secondary)",
          borderTop: "1px solid var(--border-subtle)",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "2.5rem",
            textAlign: "center",
          }}
        >
          {stats.map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontFamily: "Sora, sans-serif",
                  fontSize: "2.5rem",
                  fontWeight: 800,
                  color: "var(--teal)",
                  marginBottom: "0.5rem",
                }}
              >
                {s.value}
              </div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        style={{ padding: "6rem 1.5rem", maxWidth: "900px", margin: "0 auto" }}
      >
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <h2
            style={{
              fontFamily: "Sora, sans-serif",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 700,
              marginBottom: "1rem",
            }}
          >
            Get started in minutes
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {steps.map((s, i) => (
            <div
              key={s.title}
              style={{
                display: "flex",
                gap: "1.25rem",
                alignItems: "flex-start",
                padding: "1.5rem",
                borderRadius: "1rem",
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  minWidth: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #2dd4bf, #0891b2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Sora, sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  color: "#0d1117",
                }}
              >
                {i + 1}
              </div>
              <div>
                <h3
                  style={{
                    fontFamily: "Sora, sans-serif",
                    fontWeight: 600,
                    fontSize: "1.0625rem",
                    marginBottom: "0.375rem",
                  }}
                >
                  {s.title}
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        style={{
          padding: "6rem 1.5rem",
          textAlign: "center",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <h2
          style={{
            fontFamily: "Sora, sans-serif",
            fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
            fontWeight: 800,
            marginBottom: "1rem",
          }}
        >
          Ready to land your dream job?
        </h2>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "1.0625rem",
            marginBottom: "2.5rem",
          }}
        >
          Join thousands of students already using TalentOS.
        </p>
        <Link
          href="/register"
          style={{
            textDecoration: "none",
            padding: "0.875rem 2.25rem",
            borderRadius: "0.75rem",
            fontSize: "1rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
          className="btn-primary"
        >
          Get Started Free <ArrowRight size={18} />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "2rem 1.5rem",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "0.875rem",
        }}
      >
        © {new Date().getFullYear()} TalentOS. Built to get you placed.
      </footer>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  color,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "1.75rem",
        borderRadius: "1rem",
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        transition: "all 0.2s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(45,212,191,0.3)";
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--bg-card-hover)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--bg-card)";
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.25rem",
        }}
      >
        <Icon size={22} color="#fff" />
      </div>
      <h3
        style={{
          fontFamily: "Sora, sans-serif",
          fontWeight: 700,
          fontSize: "1.0625rem",
          marginBottom: "0.625rem",
        }}
      >
        {title}
      </h3>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
        {desc}
      </p>
    </div>
  );
}

const features = [
  {
    icon: FileText,
    title: "Resume Scoring",
    desc: "Upload your resume and get an instant ATS compatibility score with actionable improvement suggestions.",
    color: "linear-gradient(135deg, #2563eb, #1d4ed8)",
  },
  {
    icon: Linkedin,
    title: "LinkedIn Optimization",
    desc: "Analyze your LinkedIn profile for strengths, weaknesses, and get an AI-generated optimization pack.",
    color: "linear-gradient(135deg, #0ea5e9, #0284c7)",
  },
  {
    icon: Wand2,
    title: "Project Rewriter",
    desc: "Transform your project descriptions into recruiter-ready, impactful bullet points in seconds.",
    color: "linear-gradient(135deg, #2dd4bf, #0891b2)",
  },
  {
    icon: Mic,
    title: "Mock Interview",
    desc: "Practice with an AI interviewer via text or voice. Get real-time feedback on every answer.",
    color: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  },
];

const stats = [
  { value: "10k+", label: "Students placed" },
  { value: "95%", label: "ATS pass rate" },
  { value: "4x", label: "Faster job search" },
  { value: "24/7", label: "AI availability" },
];

const steps = [
  {
    title: "Create your account",
    desc: "Sign up in seconds — no credit card required to get started.",
  },
  {
    title: "Pick your module",
    desc: "Start with Resume Scoring, LinkedIn Optimization, Project Rewriter, or Mock Interview.",
  },
  {
    title: "Get AI-powered feedback",
    desc: "Our AI analyzes your inputs and delivers detailed, actionable insights instantly.",
  },
  {
    title: "Track your progress",
    desc: "Watch your Overall Readiness score climb as you work through each module.",
  },
];
