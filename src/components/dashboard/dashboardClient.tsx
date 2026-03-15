"use client";

import Link from "next/link";
import {
  FileText,
  Linkedin,
  Wand2,
  Mic,
  ArrowRight,
  CreditCard,
} from "lucide-react";

export default function DashboardClient({
  firstName,
}: {
  firstName: string;
}) {
  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontFamily: "Sora, sans-serif",
            fontSize: "1.875rem",
            fontWeight: 800,
            marginBottom: "0.375rem",
          }}
        >
          Welcome back, {firstName}!
        </h1>

        <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          Your placement readiness dashboard
        </p>
      </div>

      {/* Readiness */}
      <ReadinessBanner />

      {/* Modules */}
      <h2
        style={{
          fontFamily: "Sora, sans-serif",
          fontWeight: 700,
          fontSize: "1.0625rem",
          marginBottom: "1rem",
          color: "var(--text-secondary)",
        }}
      >
        Modules
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {modules.map((mod) => (
          <ModuleCard key={mod.href} {...mod} />
        ))}
      </div>

      {/* Activity */}
      <h2
        style={{
          fontFamily: "Sora, sans-serif",
          fontWeight: 700,
          fontSize: "1.0625rem",
          marginBottom: "1rem",
          color: "var(--text-secondary)",
        }}
      >
        Recent Activity
      </h2>

      <div
        style={{
          padding: "2.5rem",
          borderRadius: "1rem",
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem" }}>
          No activity yet. Start with one of the modules above!
        </p>
      </div>
    </div>
  );
}

/* ----------------------- */
/* Readiness Banner        */
/* ----------------------- */

function ReadinessBanner() {
  return (
    <div
      style={{
        padding: "1.75rem 2rem",
        borderRadius: "1rem",
        border: "1px solid var(--teal)",
        backgroundColor: "var(--bg-card)",
        marginBottom: "2rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 0 30px rgba(45,212,191,0.08)",
      }}
    >
      <div>
        <h2
          style={{
            fontFamily: "Sora, sans-serif",
            fontWeight: 700,
            fontSize: "1.125rem",
            marginBottom: "0.375rem",
          }}
        >
          Overall Readiness
        </h2>

        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Based on your activity across all modules
        </p>
      </div>

      <div style={{ textAlign: "right" }}>
        <div
          style={{
            fontFamily: "Sora, sans-serif",
            fontSize: "2.75rem",
            fontWeight: 800,
            color: "var(--teal)",
            lineHeight: 1,
            marginBottom: "0.5rem",
          }}
        >
          0%
        </div>

        <span
          style={{
            padding: "0.25rem 0.75rem",
            borderRadius: "999px",
            backgroundColor: "var(--bg-secondary)",
            color: "var(--text-secondary)",
            fontSize: "0.8125rem",
            fontWeight: 600,
          }}
        >
          Getting Started
        </span>
      </div>
    </div>
  );
}

/* ----------------------- */
/* Module Card             */
/* ----------------------- */

function ModuleCard({
  href,
  label,
  desc,
  icon: Icon,
  color,
  badge,
}: {
  href: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: "1.5rem",
        borderRadius: "1rem",
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        textDecoration: "none",
        color: "inherit",
        transition: "all 0.2s ease",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor =
          "rgba(45,212,191,0.3)";
        e.currentTarget.style.backgroundColor =
          "var(--bg-card-hover)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.backgroundColor =
          "var(--bg-card)";
      }}
    >
      {badge && (
        <span
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            fontWeight: 500,
          }}
        >
          {badge}
        </span>
      )}

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
          fontSize: "1rem",
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </h3>

      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "0.875rem",
          lineHeight: 1.6,
        }}
      >
        {desc}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          marginTop: "1.25rem",
          color: "var(--teal)",
          fontSize: "0.875rem",
          fontWeight: 600,
        }}
      >
        Get started <ArrowRight size={14} />
      </div>
    </Link>
  );
}

/* ----------------------- */
/* Modules Data            */
/* ----------------------- */

const modules = [
  {
    href: "/dashboard/resume-report",
    label: "Resume Scoring",
    desc: "Upload your resume and get an instant ATS compatibility score.",
    icon: FileText,
    color: "linear-gradient(135deg,#2563eb,#1d4ed8)",
    badge: "New",
  },
  {
    href: "/dashboard/linkedin-profile",
    label: "LinkedIn Optimization",
    desc: "Analyze your LinkedIn profile and generate an AI optimization pack.",
    icon: Linkedin,
    color: "linear-gradient(135deg,#0ea5e9,#0284c7)",
    badge: "New",
  },
  {
    href: "/dashboard/project-rewrite",
    label: "Project Rewriter",
    desc: "Transform project descriptions into recruiter-ready bullet points.",
    icon: Wand2,
    color: "linear-gradient(135deg,#2dd4bf,#0891b2)",
    badge: "New",
  },
  {
    href: "/dashboard/mock-interview",
    label: "Mock Interview",
    desc: "Practice with an AI interviewer via text or voice.",
    icon: Mic,
    color: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
    badge: "New",
  },
  {
    href: "/dashboard/billing",
    label: "Billing",
    desc: "Manage subscription and usage history.",
    icon: CreditCard,
    color: "linear-gradient(135deg,#f59e0b,#d97706)",
  },
];