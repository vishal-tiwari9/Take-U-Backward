// PATH: src/components/mentor/MentorApp.tsx  — CREATE
// ARIA — Adaptive Reasoning Intelligence Advisor
// Glassmorphism command-center. GSAP stagger entry, tile-expand transitions.
"use client";

import {
  useState, useRef, useEffect, useCallback, useLayoutEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import VoiceCallButton from "./VoiceCallButton";

// ─── Types ───────────────────────────────────────────────────────────
type PillarId = "LearningPath" | "Placement" | "TimeMgmt" | "FuturePredict";

interface Pillar {
  id:          PillarId;
  label:       string;
  emoji:       string;
  tagline:     string;
  accent:      string;
  placeholder: string;
  badge:       string;
}

interface Session {
  id:        string;
  topic:     string;
  title:     string;
  createdAt: string;
  content:   unknown;
}

interface Message {
  role:    "user" | "assistant";
  content: string;
  parsed?: unknown;
}

// ─── Pillar definitions ──────────────────────────────────────────────
const PILLARS: Pillar[] = [
  {
    id:          "LearningPath",
    label:       "Domain Deep-Dive",
    emoji:       "🗺",
    tagline:     "Custom learning paths grounded in live market signals.",
    accent:      "#7c3aed",
    placeholder: "e.g. I want to master AI/ML — where do I start?",
    badge:       "Learning Path Architect",
  },
  {
    id:          "Placement",
    label:       "Placement War-Room",
    emoji:       "⚔️",
    tagline:     "Company-specific interview strategy, mock Qs, resume intel.",
    accent:      "#0ea5e9",
    placeholder: "e.g. I have a Google SDE-2 interview in 3 weeks.",
    badge:       "Interview Intelligence",
  },
  {
    id:          "TimeMgmt",
    label:       "Time Architect",
    emoji:       "⏱",
    tagline:     "Optimised weekly schedules around your real constraints.",
    accent:      "#10b981",
    placeholder: "e.g. I have college 9-4, gym at 6, need 3h of coding daily.",
    badge:       "Schedule Optimizer",
  },
  {
    id:          "FuturePredict",
    label:       "Future Predictor",
    emoji:       "🔮",
    tagline:     "Career path analysis vs. market vectors — with pivot suggestions.",
    accent:      "#f59e0b",
    placeholder: "e.g. I want to become a Web3 developer. Is it future-proof?",
    badge:       "Career Pathfinder",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────
function getPillar(id: PillarId): Pillar {
  return PILLARS.find(p => p.id === id) ?? PILLARS[0];
}

// Render any JSON structure as a pretty formatted card
function StructuredResponse({ data, accent }: { data: unknown; accent: string }) {
  if (typeof data !== "object" || data === null) {
    return <p style={{ color: "rgba(255,255,255,0.75)", lineHeight: 1.8, fontSize: "0.9rem" }}>{String(data)}</p>;
  }

  const obj = data as Record<string, unknown>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {Object.entries(obj).map(([key, value]) => (
        <div key={key}>
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase",
            color: accent, fontWeight: 700, marginBottom: "0.4rem", fontFamily: "'Orbitron',monospace" }}>
            {key.replace(/([A-Z])/g, " $1").trim()}
          </div>
          {Array.isArray(value) ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {(value as unknown[]).map((item, i) => (
                <div key={i} style={{ background: `${accent}0a`, border: `1px solid ${accent}20`,
                  borderRadius: "0.5rem", padding: "0.625rem 0.875rem" }}>
                  {typeof item === "object" && item !== null ? (
                    <StructuredResponse data={item} accent={accent} />
                  ) : (
                    <span style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.85rem" }}>{String(item)}</span>
                  )}
                </div>
              ))}
            </div>
          ) : typeof value === "object" && value !== null ? (
            <div style={{ paddingLeft: "0.875rem", borderLeft: `2px solid ${accent}30` }}>
              <StructuredResponse data={value} accent={accent} />
            </div>
          ) : (
            <p style={{ color: "rgba(255,255,255,0.78)", fontSize: "0.88rem", lineHeight: 1.75, margin: 0 }}>
              {String(value)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────
export default function MentorApp() {
  const containerRef   = useRef<HTMLDivElement>(null);
  const tilesRef       = useRef<HTMLDivElement[]>([]);
  const inputRef       = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [activePillar, setActivePillar] = useState<PillarId | null>(null);
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [input,        setInput]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const [sessionId,    setSessionId]    = useState<string | null>(null);
  const [sessions,     setSessions]     = useState<Session[]>([]);
  const [showHistory,  setShowHistory]  = useState(false);
  const [marketTag,    setMarketTag]    = useState<string | null>(null);

  // ── GSAP entry stagger ──────────────────────────────────────────
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    // Set initial state
    gsap.set(".mentor-header", { opacity: 0, y: -28 });
    gsap.set(".mentor-tile",   { opacity: 0, y: 40, scale: 0.94 });
    gsap.set(".mentor-meta",   { opacity: 0 });

    const tl = gsap.timeline({ defaults: { ease: "back.out(1.4)" } });

    tl.to(".mentor-header", { opacity: 1, y: 0, duration: 0.7 })
      .to(".mentor-tile", {
        opacity: 1, y: 0, scale: 1,
        duration: 0.65,
        stagger: { each: 0.12, from: "start" },
      }, "-=0.3")
      .to(".mentor-meta", { opacity: 1, duration: 0.4 }, "-=0.2");

    // Hover glow effect on tiles — GSAP hover
    tilesRef.current.forEach(tile => {
      if (!tile) return;
      const accent = tile.dataset.accent ?? "#7c3aed";

      tile.addEventListener("mouseenter", () => {
        gsap.to(tile, {
          boxShadow: `0 0 0 1px ${accent}55, 0 12px 48px ${accent}28, 0 4px 16px rgba(0,0,0,0.4)`,
          y: -4,
          duration: 0.3,
          ease: "power2.out",
        });
      });
      tile.addEventListener("mouseleave", () => {
        gsap.to(tile, {
          boxShadow: `0 0 0 1px rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.3)`,
          y: 0,
          duration: 0.4,
          ease: "power2.out",
        });
      });
    });

    return () => { tl.kill(); };
  }, []);

  // ── Load session history ────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    try {
      const r = await fetch("/api/mentor/sessions");
      const d = await r.json();
      setSessions(d.sessions ?? []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // ── Auto-scroll messages ────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Open a pillar — GSAP tile expand ───────────────────────────
  const openPillar = useCallback((id: PillarId) => {
    setActivePillar(id);
    setMessages([]);
    setInput("");
    setSessionId(null);

    // Animate the active panel in
    requestAnimationFrame(() => {
      gsap.fromTo(".mentor-panel", {
        opacity: 0, y: 32, scale: 0.97,
      }, {
        opacity: 1, y: 0, scale: 1,
        duration: 0.55,
        ease: "back.out(1.5)",
      });
    });

    // Rotate the market tag display
    const signals = ["AI Agents +47%", "RAG Systems surging", "Rust adoption ↑32%", "Web3 Tooling growing +19%"];
    let i = 0;
    const interval = setInterval(() => {
      setMarketTag(signals[i % signals.length]);
      i++;
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  // ── Close pillar ────────────────────────────────────────────────
  const closePillar = useCallback(() => {
    gsap.to(".mentor-panel", {
      opacity: 0, y: 20, scale: 0.97,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        setActivePillar(null);
        setMessages([]);
        setMarketTag(null);
      },
    });
  }, []);

  // ── Send message ────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!input.trim() || !activePillar || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // Animate send button
    gsap.to(".mentor-send-btn", { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 });

    try {
      const r = await fetch("/api/mentor/consult", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          topic:     activePillar,
          message:   userMsg.content,
          sessionId,
          messages:  messages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const d = await r.json();

      if (d.sessionId) setSessionId(d.sessionId);

      const aiMsg: Message = {
        role:    "assistant",
        content: d.raw ?? "",
        parsed:  d.isStructured ? d.content : undefined,
      };
      setMessages(prev => [...prev, aiMsg]);

      // Animate new message in
      requestAnimationFrame(() => {
        gsap.fromTo(".mentor-msg:last-child", { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.4, ease: "power2.out" });
      });

      // Refresh history after save
      await loadHistory();
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "ARIA encountered an error. Please try again.",
      }]);
    }
    setLoading(false);
  }, [input, activePillar, loading, sessionId, messages, loadHistory]);

  // ── Load a past session ─────────────────────────────────────────
  const loadSession = useCallback(async (s: Session) => {
    setActivePillar(s.topic as PillarId);
    setSessionId(s.id);
    setShowHistory(false);

    // Reconstruct messages from content
    setMessages([
      {
        role:   "assistant",
        content: JSON.stringify(s.content),
        parsed:  s.content,
      },
    ]);

    requestAnimationFrame(() => {
      gsap.fromTo(".mentor-panel", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45, ease: "back.out(1.4)" });
    });
  }, []);

  const pillar = activePillar ? getPillar(activePillar) : null;

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div ref={containerRef} style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        .mentor-glass {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .mentor-tile {
          cursor: pointer;
          transition: border-color 0.2s;
          position: relative;
          overflow: hidden;
        }
        .mentor-tile::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, transparent 60%);
          pointer-events: none;
        }
        .mentor-input:focus { outline: none; }
        .mentor-msg { animation: none; }
        textarea.mentor-input { resize: none; font-family: 'DM Sans', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      `}</style>

      {/* ── Grid / Command Centre (shown when no pillar active) ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <AnimatePresence mode="wait">
        {!activePillar && (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ flex: 1, overflowY: "auto", paddingBottom: "2rem" }}>

            {/* Header */}
            <div className="mentor-header" style={{ marginBottom: "2.5rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.5rem" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "10px",
                      background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.1rem", boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}>◈</div>
                    <div>
                      <div style={{ fontFamily: "'Orbitron',monospace", fontSize: "0.6rem", letterSpacing: "0.22em",
                        color: "#a78bfa", textTransform: "uppercase", fontWeight: 700 }}>TalentOS</div>
                      <div style={{ fontFamily: "'Orbitron',monospace", fontSize: "1.15rem", fontWeight: 900,
                        color: "#fff", letterSpacing: "0.04em", lineHeight: 1 }}>ARIA</div>
                    </div>
                  </div>
                  <h1 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "1.75rem", fontWeight: 600,
                    color: "#fff", margin: 0, letterSpacing: "-0.02em", lineHeight: 1.25 }}>
                    Your AI Career{" "}
                    <span style={{ background: "linear-gradient(135deg,#a855f7,#7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      Command Centre
                    </span>
                  </h1>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.9rem", margin: "0.4rem 0 0",
                    fontFamily: "'DM Sans',sans-serif", fontWeight: 300 }}>
                    Four intelligence pillars. One mentor. Real market data.
                  </p>
                </div>

                {/* History button */}
                <button onClick={() => setShowHistory(true)}
                  style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.55)", fontSize: "0.78rem", cursor: "pointer",
                    fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", gap: "0.4rem",
                    transition: "all .2s" }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(124,58,237,0.1)"; el.style.borderColor = "rgba(124,58,237,0.35)"; el.style.color = "#a78bfa"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.05)"; el.style.borderColor = "rgba(255,255,255,0.1)"; el.style.color = "rgba(255,255,255,0.55)"; }}>
                  🕐 Session History
                  {sessions.length > 0 && (
                    <span style={{ background: "#7c3aed", color: "#fff", fontSize: "0.6rem", padding: "0.05rem 0.35rem",
                      borderRadius: "999px", fontWeight: 700 }}>{sessions.length}</span>
                  )}
                </button>
              </div>
            </div>

            {/* 4-Pillar Tile Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.125rem" }}>
              {PILLARS.map((p, i) => (
                <div
                  key={p.id}
                  className="mentor-tile mentor-glass"
                  data-accent={p.accent}
                  ref={el => { if (el) tilesRef.current[i] = el; }}
                  onClick={() => openPillar(p.id)}
                  style={{ borderRadius: "1.125rem", padding: "1.75rem",
                    boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 2px 8px rgba(0,0,0,0.3)" }}>

                  {/* Accent top-bar */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                    background: `linear-gradient(90deg, ${p.accent}, transparent)`, borderRadius: "1.125rem 1.125rem 0 0" }} />

                  <div style={{ fontSize: "2.25rem", marginBottom: "0.875rem",
                    filter: `drop-shadow(0 0 12px ${p.accent}66)` }}>{p.emoji}</div>

                  <div style={{ marginBottom: "0.375rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <h2 style={{ fontFamily: "'Orbitron',monospace", fontSize: "0.82rem", fontWeight: 700,
                      color: "#fff", margin: 0, letterSpacing: "0.04em" }}>{p.label}</h2>
                    <span style={{ fontSize: "0.55rem", padding: "0.1rem 0.45rem", borderRadius: "999px",
                      background: `${p.accent}20`, border: `1px solid ${p.accent}40`,
                      color: p.accent, letterSpacing: "0.08em", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {p.badge}
                    </span>
                  </div>

                  <p style={{ color: "rgba(255,255,255,0.42)", fontSize: "0.82rem", lineHeight: 1.65,
                    margin: "0 0 1.25rem", fontFamily: "'DM Sans',sans-serif", fontWeight: 300 }}>
                    {p.tagline}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ height: "1px", flex: 1, background: `${p.accent}20` }} />
                    <span style={{ fontSize: "0.68rem", color: p.accent, fontWeight: 700,
                      letterSpacing: "0.1em", textTransform: "uppercase", paddingLeft: "0.75rem" }}>
                      Open →
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Market signals ribbon */}
            <div className="mentor-meta" style={{ marginTop: "2rem",
              background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.12)",
              borderRadius: "0.625rem", padding: "0.625rem 1rem",
              display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <div style={{ fontSize: "0.58rem", fontFamily: "'Orbitron',monospace", letterSpacing: "0.15em",
                color: "#a78bfa", fontWeight: 700 }}>MARKET INTEL LIVE</div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["AI Agents +47% YoY", "Rust adoption ↑32%", "RAG Systems surging", "Remote roles: 73%"].map(s => (
                  <span key={s} style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.45)",
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    padding: "0.15rem 0.5rem", borderRadius: "999px" }}>{s}</span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Active Pillar Panel ────────────────────────────────── */}
        {activePillar && pillar && (
          <motion.div key="panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mentor-panel"
            style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>

            {/* Panel header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: "1.25rem", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                <button onClick={closePillar}
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.5rem", color: "rgba(255,255,255,0.5)", cursor: "pointer",
                    fontSize: "0.75rem", padding: "0.35rem 0.75rem", fontFamily: "'DM Sans',sans-serif",
                    transition: "all .2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.25)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; }}>
                  ← Back
                </button>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.25rem" }}>{pillar.emoji}</span>
                    <h2 style={{ fontFamily: "'Orbitron',monospace", fontSize: "0.88rem", fontWeight: 700,
                      color: "#fff", margin: 0 }}>{pillar.label}</h2>
                    <span style={{ fontSize: "0.55rem", padding: "0.1rem 0.45rem", borderRadius: "999px",
                      background: `${pillar.accent}20`, border: `1px solid ${pillar.accent}40`,
                      color: pillar.accent, letterSpacing: "0.08em", fontWeight: 700 }}>
                      {pillar.badge}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.35)",
                    fontFamily: "'DM Sans',sans-serif" }}>{pillar.tagline}</p>
                </div>
              </div>

              {/* Live market ticker + Voice Call */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flexShrink: 0 }}>
                <AnimatePresence mode="wait">
                  {marketTag && (
                    <motion.div key={marketTag}
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                      style={{ fontSize: "0.62rem", padding: "0.25rem 0.65rem", borderRadius: "999px",
                        background: `${pillar.accent}14`, border: `1px solid ${pillar.accent}30`,
                        color: pillar.accent, letterSpacing: "0.08em", fontWeight: 600 }}>
                      📡 {marketTag}
                    </motion.div>
                  )}
                </AnimatePresence>

                <VoiceCallButton
                  pillarId={activePillar}
                  sessionId={sessionId}
                  accent={pillar.accent}
                  pillarLabel={pillar.label}
                />
              </div>
            </div>

            {/* Messages area */}
            <div style={{ flex: 1, overflowY: "auto", paddingRight: "0.25rem", marginBottom: "1rem" }}>

              {messages.length === 0 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", height: "100%", gap: "1rem", opacity: 0.5 }}>
                  <div style={{ fontSize: "3rem", filter: `drop-shadow(0 0 20px ${pillar.accent}66)` }}>{pillar.emoji}</div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Orbitron',monospace", fontSize: "0.7rem", color: pillar.accent,
                      letterSpacing: "0.15em", marginBottom: "0.35rem" }}>ARIA IS READY</div>
                    <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", margin: 0,
                      fontFamily: "'DM Sans',sans-serif" }}>
                      {pillar.placeholder}
                    </p>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {messages.map((msg, i) => (
                  <div key={i} className="mentor-msg"
                    style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>

                    {msg.role === "assistant" && (
                      <div style={{ width: 28, height: 28, borderRadius: "8px", flexShrink: 0, marginRight: "0.625rem",
                        background: `linear-gradient(135deg, ${pillar.accent}, ${pillar.accent}88)`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.8rem", boxShadow: `0 0 12px ${pillar.accent}44` }}>◈</div>
                    )}

                    <div style={{ maxWidth: msg.role === "user" ? "72%" : "88%",
                      background: msg.role === "user"
                        ? `${pillar.accent}22`
                        : "rgba(255,255,255,0.04)",
                      border: `1px solid ${msg.role === "user" ? pillar.accent + "40" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: msg.role === "user" ? "1rem 1rem 0.25rem 1rem" : "0.25rem 1rem 1rem 1rem",
                      padding: "0.875rem 1.125rem",
                      backdropFilter: "blur(12px)" }}>

                      {msg.role === "assistant" && msg.parsed ? (
                        <StructuredResponse data={msg.parsed} accent={pillar.accent} />
                      ) : (
                        <p style={{ margin: 0, fontSize: "0.88rem", color: "rgba(255,255,255,0.82)",
                          lineHeight: 1.75, fontFamily: "'DM Sans',sans-serif", whiteSpace: "pre-wrap" }}>
                          {msg.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "8px",
                      background: `linear-gradient(135deg, ${pillar.accent}, ${pillar.accent}88)`,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem" }}>◈</div>
                    <div style={{ display: "flex", gap: "4px", alignItems: "center", padding: "0.75rem 1rem",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.25rem 1rem 1rem 1rem" }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: "50%",
                          background: pillar.accent, animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                    <style>{`@keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }`}</style>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input bar */}
            <div style={{ flexShrink: 0,
              background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)",
              border: `1px solid ${pillar.accent}28`, borderRadius: "1rem",
              padding: "0.75rem 0.875rem",
              boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 -4px 24px rgba(0,0,0,0.2)` }}>

              {/* Accent top line */}
              <div style={{ height: "1px", background: `linear-gradient(90deg, ${pillar.accent}60, transparent)`,
                marginBottom: "0.625rem", borderRadius: "1px" }} />

              <textarea
                ref={inputRef}
                className="mentor-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={pillar.placeholder}
                rows={3}
                style={{ width: "100%", background: "transparent", border: "none",
                  color: "#fff", fontSize: "0.9rem", lineHeight: 1.7,
                  fontFamily: "'DM Sans',sans-serif", fontWeight: 300,
                  letterSpacing: "0.01em", marginBottom: "0.625rem" }}
              />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.2)", fontFamily: "'DM Sans',sans-serif" }}>
                  Enter to send · Shift+Enter for newline
                </span>
                <button
                  className="mentor-send-btn"
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  style={{ padding: "0.5rem 1.25rem", borderRadius: "0.5rem", border: "none",
                    background: loading || !input.trim()
                      ? "rgba(255,255,255,0.06)"
                      : `linear-gradient(135deg, ${pillar.accent}, ${pillar.accent}99)`,
                    color: loading || !input.trim() ? "rgba(255,255,255,0.2)" : "#fff",
                    fontSize: "0.8rem", fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
                    cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                    letterSpacing: "0.06em", transition: "all .2s",
                    boxShadow: loading || !input.trim() ? "none" : `0 0 16px ${pillar.accent}44` }}>
                  {loading ? "Thinking…" : "Send to ARIA →"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* ── Session History Drawer ────────────────────────────────── */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(4px)", zIndex: 40 }} />
            <motion.div key="drawer"
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(400px,90vw)",
                background: "rgba(10,6,24,0.97)", backdropFilter: "blur(24px)",
                borderLeft: "1px solid rgba(124,58,237,0.2)", zIndex: 50,
                display: "flex", flexDirection: "column", overflow: "hidden" }}>

              <div style={{ padding: "1.5rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: "'Orbitron',monospace", fontSize: "0.7rem", color: "#a78bfa",
                    letterSpacing: "0.15em", marginBottom: "0.2rem" }}>SESSION ARCHIVE</div>
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#fff",
                    fontFamily: "'DM Sans',sans-serif" }}>Past ARIA Sessions</h3>
                </div>
                <button onClick={() => setShowHistory(false)}
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "0.5rem", color: "rgba(255,255,255,0.5)", cursor: "pointer",
                    padding: "0.35rem 0.7rem", fontSize: "0.75rem", fontFamily: "'DM Sans',sans-serif" }}>
                  ✕ Close
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
                {sessions.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "3rem 1rem", color: "rgba(255,255,255,0.2)" }}>
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>◈</div>
                    <p style={{ fontSize: "0.8rem", fontFamily: "'DM Sans',sans-serif" }}>No sessions yet.</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                    {sessions.map(s => {
                      const p = getPillar(s.topic as PillarId);
                      return (
                        <button key={s.id} onClick={() => loadSession(s)}
                          style={{ textAlign: "left", background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.75rem",
                            padding: "0.875rem 1rem", cursor: "pointer", transition: "all .2s",
                            fontFamily: "'DM Sans',sans-serif" }}
                          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = `${p.accent}0e`; el.style.borderColor = `${p.accent}35`; }}
                          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.03)"; el.style.borderColor = "rgba(255,255,255,0.07)"; }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                            <span style={{ fontSize: "0.9rem" }}>{p.emoji}</span>
                            <span style={{ fontSize: "0.6rem", color: p.accent, fontWeight: 700,
                              letterSpacing: "0.1em", textTransform: "uppercase" }}>{p.badge}</span>
                          </div>
                          <p style={{ margin: "0 0 0.35rem", fontSize: "0.82rem", color: "#fff", fontWeight: 500,
                            lineClamp: 2, overflow: "hidden", display: "-webkit-box",
                            WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {s.title}
                          </p>
                          <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)" }}>
                            {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}