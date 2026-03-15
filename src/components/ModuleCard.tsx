// PATH: src/components/ModuleCard.tsx  — REPLACE entire file
"use client";

import Link from "next/link";
import { ArrowRight, FileText, Linkedin, Wand2, Mic, CreditCard, Send, LucideIcon } from "lucide-react";
import { useState } from "react";

// ── Icon map — keeps icons in the client bundle only ──────────────
const ICON_MAP: Record<string, LucideIcon> = {
  FileText, Linkedin, Wand2, Mic, CreditCard, Send,
};

// ── Module definitions live here (client-only, no serialisation) ──
export const MODULE_LIST = [
  { href: "/dashboard/resume-report",    label: "Resume Scoring",        desc: "Upload your resume and get an instant ATS compatibility score.",           iconKey: "FileText",  color: "linear-gradient(135deg, #2563EB, #1D4ED8)", badge: "AI"  },
  { href: "/dashboard/linkedin-profile", label: "LinkedIn Optimization", desc: "Analyse your LinkedIn profile and generate an AI optimisation pack.",      iconKey: "Linkedin",  color: "linear-gradient(135deg, #0EA5E9, #0284C7)", badge: "AI"  },
  { href: "/dashboard/project-rewrite",  label: "Project Rewriter",      desc: "Transform project descriptions into recruiter-ready bullet points.",        iconKey: "Wand2",     color: "linear-gradient(135deg, #0D9488, #0891B2)", badge: "AI"  },
  { href: "/dashboard/mock-interview",   label: "Mock Interview",         desc: "Practice with an AI interviewer via text or voice — instant feedback.",    iconKey: "Mic",       color: "linear-gradient(135deg, #8B5CF6, #7C3AED)", badge: "AI"  },
  { href: "/dashboard/outreach",         label: "Outreach Generator",    desc: "Generate high-conversion cold emails & LinkedIn messages with AI.",         iconKey: "Send",      color: "linear-gradient(135deg, #2563EB, #0D9488)", badge: "NEW" },
  { href: "/dashboard/billing",          label: "Billing",               desc: "Manage your subscription and view usage history.",                          iconKey: "CreditCard",color: "linear-gradient(135deg, #F59E0B, #D97706)"              },
] as const;

// ── Single card ────────────────────────────────────────────────────
export function ModuleCard({
  href, label, desc, iconKey, color, badge,
}: {
  href:    string;
  label:   string;
  desc:    string;
  iconKey: string;
  color:   string;
  badge?:  string;
}) {
  const [hovered, setHovered] = useState(false);
  const Icon = ICON_MAP[iconKey] ?? FileText;

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "block",
        padding: "1.5rem",
        borderRadius: "1rem",
        backgroundColor: "var(--bg-card)",
        border: hovered ? "1px solid rgba(37,99,235,0.25)" : "1px solid var(--border)",
        textDecoration: "none",
        color: "inherit",
        transition: "all 0.2s ease",
        position: "relative",
        boxShadow: hovered
          ? "0 4px 16px rgba(37,99,235,0.08), 0 2px 4px rgba(15,23,42,0.06)"
          : "0 1px 3px rgba(15,23,42,0.04)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {badge && (
        <span style={{
          position: "absolute", top: "1rem", right: "1rem",
          fontSize: "0.7rem", fontWeight: 700, fontFamily: "Sora, sans-serif",
          color: badge === "NEW" ? "#0D9488" : "#2563EB",
          backgroundColor: badge === "NEW" ? "rgba(13,148,136,0.08)" : "#EFF6FF",
          border: `1px solid ${badge === "NEW" ? "rgba(13,148,136,0.25)" : "rgba(37,99,235,0.2)"}`,
          padding: "0.15rem 0.5rem", borderRadius: "999px",
        }}>
          {badge}
        </span>
      )}

      <div style={{
        width: "48px", height: "48px", borderRadius: "12px",
        background: color, display: "flex", alignItems: "center",
        justifyContent: "center", marginBottom: "1.25rem",
      }}>
        <Icon size={22} color="#fff" />
      </div>

      <h3 style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1rem", marginBottom: "0.5rem", color: "var(--text-primary)" }}>
        {label}
      </h3>
      <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
        {desc}
      </p>

      <div style={{
        display: "flex", alignItems: "center", gap: "0.375rem", marginTop: "1.25rem",
        color: hovered ? "#2563EB" : "var(--text-muted)",
        fontSize: "0.875rem", fontWeight: 600, transition: "color 0.15s",
      }}>
        Get started <ArrowRight size={14} />
      </div>
    </Link>
  );
}

// ── Grid — renders all modules, purely client-side ─────────────────
export function ModuleGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.25rem", marginBottom: "2.5rem" }}>
      {MODULE_LIST.map((mod) => (
        <ModuleCard key={mod.href} {...mod} />
      ))}
    </div>
  );
}