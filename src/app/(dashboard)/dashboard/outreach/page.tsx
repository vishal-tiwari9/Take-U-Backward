"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mail, Linkedin, Send, Copy, Check, RefreshCw, Trash2,
  Sparkles, Link2, Clock, AlertCircle, FileText, Zap,
  User2, Building2, Target, Lightbulb, ChevronRight, X,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────
type MessageType = "cold_email" | "linkedin_dm" | "linkedin_connect";
type Tone        = "professional" | "casual" | "bold" | "warm";

interface FormState {
  messageType:   MessageType;
  tone:          Tone;
  targetRole:    string;
  companyName:   string;
  hiringManager: string;
  jobUrl:        string;
  userProjects:  string;
  userUSP:       string;
  extraContext:  string;
}

interface GeneratedOutput {
  id:           string;
  generatedText: string;
  subject:      string | null;
  charCount:    number;
  jobScraped:   boolean;
}

interface HistoryItem {
  id:            string;
  messageType:   string;
  tone:          string;
  targetRole:    string;
  companyName:   string;
  hiringManager: string | null;
  subject:       string | null;
  generatedText: string;
  charCount:     number;
  createdAt:     string;
}

// ── Constants ──────────────────────────────────────────────────────
const MESSAGE_TYPES: {
  value: MessageType; label: string; icon: React.ElementType;
  desc: string; limit?: number; color: string;
}[] = [
  { value: "cold_email",       label: "Cold Email",         icon: Mail,     desc: "Full email + subject line",    color: "var(--primary)" },
  { value: "linkedin_dm",      label: "LinkedIn DM",        icon: Linkedin, desc: "80–120 words, direct message", color: "#0a66c2"        },
  { value: "linkedin_connect", label: "Connect Request",    icon: User2,    desc: "≤300 chars, hook only",        color: "var(--secondary)", limit: 300 },
];

const TONES: { value: Tone; label: string; emoji: string; hint: string }[] = [
  { value: "professional", label: "Professional", emoji: "💼", hint: "Crisp, confident, respects time"  },
  { value: "casual",       label: "Casual",       emoji: "👋", hint: "Smart & friendly, not sloppy"    },
  { value: "bold",         label: "Bold",         emoji: "⚡", hint: "Audacious opener, high-impact"   },
  { value: "warm",         label: "Warm",         emoji: "🌱", hint: "Mission-driven, human, curious"  },
];

const INITIAL: FormState = {
  messageType: "cold_email", tone: "professional",
  targetRole: "", companyName: "", hiringManager: "",
  jobUrl: "", userProjects: "", userUSP: "", extraContext: "",
};

// ── Helpers ────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const TYPE_BG: Record<string, string> = {
  cold_email:       "rgba(37,99,235,0.1)",
  linkedin_dm:      "rgba(10,102,194,0.1)",
  linkedin_connect: "rgba(13,148,136,0.1)",
};
const TYPE_COLOR: Record<string, string> = {
  cold_email: "var(--primary)", linkedin_dm: "#0a66c2", linkedin_connect: "var(--secondary)",
};
const TYPE_ICON: Record<string, React.ElementType> = {
  cold_email: Mail, linkedin_dm: Linkedin, linkedin_connect: User2,
};

// ── Shared styles ──────────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: "100%", padding: "0.65rem 0.9rem",
  backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)",
  borderRadius: "0.5rem", color: "var(--text-primary)", fontSize: "0.875rem",
  outline: "none", fontFamily: "DM Sans, sans-serif", lineHeight: 1.5,
  boxSizing: "border-box",
};

// ── Main component ─────────────────────────────────────────────────
export default function OutreachPage() {
  const [form,        setForm]        = useState<FormState>(INITIAL);
  const [output,      setOutput]      = useState<GeneratedOutput | null>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");
  const [copied,      setCopied]      = useState(false);
  const [copiedSub,   setCopiedSub]   = useState(false);
  const [history,     setHistory]     = useState<HistoryItem[]>([]);
  const [histLoading, setHistLoading] = useState(true);
  const [tab,         setTab]         = useState<"generate" | "history">("generate");
  const [editMode,    setEditMode]    = useState(false);
  const [editText,    setEditText]    = useState("");
  const [urlValidated,setUrlValidated]= useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = useCallback(async () => {
    setHistLoading(true);
    try {
      const r = await fetch("/api/outreach/history?limit=20");
      const d = await r.json();
      setHistory(d.messages ?? []);
    } catch { /* silent */ }
    setHistLoading(false);
  }, []);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(p => ({ ...p, [k]: v }));
    if (k === "jobUrl") setUrlValidated(false);
  }

  function validateUrl() {
    try { new URL(form.jobUrl); setUrlValidated(true); setError(""); }
    catch { setError("Invalid URL — paste the full URL including https://"); }
  }

  async function generate() {
    const missing = (["targetRole","companyName","userProjects","userUSP"] as const)
      .filter(k => !form[k].trim());
    if (missing.length) {
      setError(`Please fill in: ${missing.map(k => k.replace(/([A-Z])/g," $1").toLowerCase()).join(", ")}`);
      return;
    }
    setError(""); setLoading(true); setOutput(null); setEditMode(false);

    try {
      const res  = await fetch("/api/outreach/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Generation failed."); return; }
      setOutput(data);
      setEditText(data.generatedText);
      loadHistory();
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    } catch { setError("Network error — please try again."); }
    finally  { setLoading(false); }
  }

  async function deleteMessage(id: string) {
    await fetch("/api/outreach/history", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setHistory(p => p.filter(h => h.id !== id));
  }

  function copyToClipboard(text: string, setter: (v: boolean) => void) {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  function loadFromHistory(item: HistoryItem) {
    setOutput({ id: item.id, generatedText: item.generatedText, subject: item.subject, charCount: item.charCount, jobScraped: false });
    setEditText(item.generatedText);
    setEditMode(false);
    setTab("generate");
    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  const selType   = MESSAGE_TYPES.find(t => t.value === form.messageType)!;
  const charLimit = selType.limit;
  const liveText  = editMode ? editText : (output?.generatedText ?? "");
  const overLimit = charLimit && output ? output.charCount > charLimit : false;

  // ── RENDER ────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Page header ── */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #2563EB, #0D9488)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Send size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: "1.625rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1.2 }}>
              AI Outreach Generator
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.1rem" }}>
              Cold emails &amp; LinkedIn messages that actually get replies — no cringe, no templates
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.75rem", padding: "0.25rem", background: "var(--bg-secondary)", borderRadius: "0.75rem", width: "fit-content", border: "1px solid var(--border)" }}>
        {(["generate","history"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, transition: "all 0.15s", background: tab === t ? "var(--bg-card)" : "transparent", color: tab === t ? "var(--text-primary)" : "var(--text-secondary)", boxShadow: tab === t ? "0 1px 4px rgba(15,23,42,0.08)" : "none" }}>
            {t === "generate"
              ? <><Sparkles size={14} style={{ display:"inline", marginRight:"0.375rem", verticalAlign:"middle" }} />Generate</>
              : <><Clock size={14} style={{ display:"inline", marginRight:"0.375rem", verticalAlign:"middle" }} />History ({history.length})</>
            }
          </button>
        ))}
      </div>

      {/* ═══════ GENERATE TAB ═══════ */}
      {tab === "generate" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>

          {/* ── LEFT: form ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* 1. Message type */}
            <Card>
              <SLabel icon={<FileText size={14} />} label="Message Type" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.5rem" }}>
                {MESSAGE_TYPES.map(t => {
                  const on = form.messageType === t.value;
                  return (
                    <button key={t.value} onClick={() => set("messageType", t.value)} style={{ padding: "0.875rem 0.5rem", borderRadius: "0.625rem", border: `1px solid ${on ? t.color : "var(--border)"}`, background: on ? `${t.color}12` : "var(--bg-secondary)", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
                      <t.icon size={20} color={on ? t.color : "var(--text-muted)"} style={{ margin: "0 auto 0.375rem", display: "block" }} />
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: on ? t.color : "var(--text-secondary)", marginBottom: "0.125rem" }}>{t.label}</p>
                      <p style={{ fontSize: "0.65rem", color: "var(--text-muted)", lineHeight: 1.3 }}>{t.desc}</p>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 2. Tone */}
            <Card>
              <SLabel icon={<Lightbulb size={14} />} label="Tone" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                {TONES.map(t => {
                  const on = form.tone === t.value;
                  return (
                    <button key={t.value} onClick={() => set("tone", t.value)} style={{ padding: "0.625rem 0.75rem", borderRadius: "0.5rem", border: `1px solid ${on ? "rgba(37,99,235,0.4)" : "var(--border)"}`, background: on ? "var(--primary-light)" : "var(--bg-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem", transition: "all 0.15s" }}>
                      <span style={{ fontSize: "1.1rem" }}>{t.emoji}</span>
                      <div style={{ textAlign: "left" }}>
                        <p style={{ fontSize: "0.8125rem", fontWeight: 700, color: on ? "var(--primary)" : "var(--text-secondary)" }}>{t.label}</p>
                        <p style={{ fontSize: "0.675rem", color: "var(--text-muted)", lineHeight: 1.3 }}>{t.hint}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* 3. Target */}
            <Card>
              <SLabel icon={<Target size={14} />} label="Target" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <FField label="Target Role *" placeholder="Senior Frontend Engineer" value={form.targetRole} onChange={v => set("targetRole", v)} icon={<Zap size={13} />} />
                <FField label="Company *"     placeholder="Stripe, Notion, Google…"  value={form.companyName} onChange={v => set("companyName", v)} icon={<Building2 size={13} />} />
              </div>
              <FField label="Hiring Manager / Recipient" placeholder="Alex Chen — leave blank to use [Hiring Manager Name] tag" value={form.hiringManager} onChange={v => set("hiringManager", v)} icon={<User2 size={13} />} />

              {/* Job URL */}
              <div style={{ marginTop: "0.75rem" }}>
                <label style={lbl}>
                  <Link2 size={12} style={{ display:"inline", marginRight:"0.25rem", verticalAlign:"middle" }} />
                  Job Posting URL
                  <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "0.375rem" }}>(optional — server scrapes the JD for you)</span>
                </label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input type="url" placeholder="https://jobs.stripe.com/roles/1234" value={form.jobUrl} onChange={e => set("jobUrl", e.target.value)} style={inp} />
                  <button onClick={validateUrl} disabled={!form.jobUrl} title="Validate URL" style={{ padding: "0.65rem 0.875rem", borderRadius: "0.5rem", border: `1px solid ${urlValidated ? "rgba(13,148,136,0.4)" : "var(--border)"}`, background: urlValidated ? "rgba(13,148,136,0.08)" : "var(--bg-secondary)", color: urlValidated ? "var(--secondary)" : "var(--text-secondary)", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 600, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.375rem", transition: "all 0.15s", opacity: !form.jobUrl ? 0.5 : 1 }}>
                    {urlValidated ? <><Check size={13} />Saved</> : <><Link2 size={13} />Use URL</>}
                  </button>
                </div>
              </div>
            </Card>

            {/* 4. Your profile */}
            <Card>
              <SLabel icon={<User2 size={14} />} label="Your Profile" />

              <div>
                <label style={lbl}>
                  Your USP / One-liner *
                  <Tooltip text='What makes you different in one sentence? e.g. "I build AI tools that ship fast — ClipSynth got 2k signups in 48h without a marketing budget"' />
                </label>
                <textarea rows={2} placeholder="e.g. I build production-grade AI features solo — my last tool hit 1k users in 72h with zero marketing spend" value={form.userUSP} onChange={e => set("userUSP", e.target.value)} style={{ ...inp, resize: "vertical" }} />
              </div>

              <div>
                <label style={lbl}>
                  Key Projects &amp; Achievements *
                  <Tooltip text='Comma-separated. Be specific with numbers: "ClipSynth — AI video editor, 2k users in 48h", "Smart Email Agent — cut inbox time 60%", "RAG pipeline — 400 GitHub stars"' />
                </label>
                <textarea rows={3} placeholder="ClipSynth — AI video editor with 2k signups in 48h, Smart Email Agent — reduced inbox time by 60%, Open-source RAG pipeline — 400+ GitHub stars" value={form.userProjects} onChange={e => set("userProjects", e.target.value)} style={{ ...inp, resize: "vertical" }} />
              </div>

              <div>
                <label style={lbl}>
                  Extra Context
                  <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: "0.375rem" }}>(optional)</span>
                </label>
                <textarea rows={2} placeholder="Mutual connection, event you both attended, referral, something specific about their product you built on top of, etc." value={form.extraContext} onChange={e => set("extraContext", e.target.value)} style={{ ...inp, resize: "vertical" }} />
              </div>
            </Card>

            {/* Error */}
            {error && (
              <div style={{ padding: "0.875rem 1rem", borderRadius: "0.625rem", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", gap: "0.625rem", alignItems: "flex-start" }}>
                <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span style={{ fontSize: "0.875rem", color: "#ef4444", flex: 1 }}>{error}</span>
                <button onClick={() => setError("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 0, display: "flex" }}><X size={15} /></button>
              </div>
            )}

            {/* Generate button */}
            <button onClick={generate} disabled={loading} style={{ width: "100%", padding: "1rem", borderRadius: "0.75rem", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.75 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem", fontSize: "1rem", fontWeight: 700, fontFamily: "Sora, sans-serif", background: "linear-gradient(135deg, #2563EB, #0D9488)", color: "#fff", boxShadow: "0 4px 16px rgba(37,99,235,0.28)", transition: "opacity 0.15s" }}>
              {loading
                ? <><Dots /> Crafting your message…</>
                : <><Sparkles size={18} /> Generate Message</>
              }
            </button>
          </div>

          {/* ── RIGHT: output ── */}
          <div ref={outputRef} style={{ position: "sticky", top: "80px" }}>

            {/* Empty state */}
            {!output && !loading && (
              <div style={{ padding: "3rem 2rem", borderRadius: "1rem", background: "var(--bg-card)", border: "1px dashed var(--border)", textAlign: "center" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg, rgba(37,99,235,0.07),rgba(13,148,136,0.07))", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                  <Sparkles size={24} color="var(--text-muted)" />
                </div>
                <p style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>Your message appears here</p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.6, maxWidth: "280px", margin: "0 auto 1.75rem" }}>
                  Fill in the form and hit Generate. The AI writes like a human who did their homework.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", textAlign: "left" }}>
                  {[
                    "Replace every [Variable Tag] before you hit send",
                    "Bold tone works best for engineer-to-engineer outreach",
                    "Job URL = more contextual message — paste it if you have one",
                    "Regenerate as many times as you need — all saved to history",
                  ].map((tip, i) => (
                    <div key={i} style={{ display: "flex", gap: "0.5rem" }}>
                      <ChevronRight size={13} color="var(--secondary)" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div style={{ padding: "3rem 2rem", borderRadius: "1rem", background: "var(--bg-card)", border: "1px solid var(--border)", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", gap: "5px", marginBottom: "1.5rem" }}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "linear-gradient(135deg,#2563EB,#0D9488)", animation: `bounce 1.2s ease-in-out ${i*0.15}s infinite` }} />
                  ))}
                </div>
                <p style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.375rem" }}>Writing your message…</p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Crafting something a recruiter will actually want to read</p>
              </div>
            )}

            {/* Output card */}
            {output && !loading && (
              <div style={{ borderRadius: "1rem", background: "var(--bg-card)", border: "1px solid var(--border)", overflow: "hidden" }}>

                {/* Output header */}
                <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)", background: "var(--bg-secondary)", display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <span style={{ fontSize: "0.725rem", fontWeight: 700, padding: "0.225rem 0.625rem", borderRadius: "999px", background: TYPE_BG[form.messageType], color: TYPE_COLOR[form.messageType], display: "flex", alignItems: "center", gap: "0.25rem", whiteSpace: "nowrap" }}>
                    {(() => { const I = TYPE_ICON[form.messageType]; return <I size={12} />; })()}
                    {selType.label}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {output.charCount} chars{charLimit ? ` / ${charLimit}` : ""}
                  </span>
                  {overLimit && (
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.08)", padding: "0.125rem 0.5rem", borderRadius: "999px" }}>
                      Over limit — trim before sending
                    </span>
                  )}
                  {output.jobScraped && (
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "var(--secondary)", background: "rgba(13,148,136,0.08)", padding: "0.125rem 0.5rem", borderRadius: "999px", marginLeft: "auto" }}>
                      ✓ JD scraped
                    </span>
                  )}
                  <div style={{ display: "flex", gap: "0.375rem", marginLeft: output.jobScraped ? "0" : "auto" }}>
                    <ABtn onClick={() => { setEditMode(!editMode); }} title={editMode ? "Preview" : "Edit"} active={editMode}><FileText size={13} /></ABtn>
                    <ABtn onClick={generate} title="Regenerate" disabled={loading}><RefreshCw size={13} /></ABtn>
                  </div>
                </div>

                {/* Subject line */}
                {output.subject && (
                  <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)", background: "rgba(37,99,235,0.025)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0 }}>Subject</span>
                    <span style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text-primary)", flex: 1 }}>{output.subject}</span>
                    <button onClick={() => copyToClipboard(output.subject!, setCopiedSub)} style={{ background:"none", border:"none", cursor:"pointer", color: copiedSub ? "var(--secondary)" : "var(--text-muted)", padding:"0.25rem", display:"flex", flexShrink:0 }} title="Copy subject">
                      {copiedSub ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                )}

                {/* Message body */}
                <div style={{ padding: "1.25rem" }}>
                  {editMode
                    ? <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={12} style={{ ...inp, fontFamily:"DM Sans, sans-serif", fontSize:"0.9375rem", lineHeight:1.8, resize:"vertical", minHeight:"260px", width:"100%" }} />
                    : <pre style={{ margin:0, whiteSpace:"pre-wrap", wordBreak:"break-word", fontFamily:"DM Sans, sans-serif", fontSize:"0.9375rem", lineHeight:1.8, color:"var(--text-primary)" }}>{output.generatedText}</pre>
                  }
                </div>

                {/* Variable tag notice */}
                {output.generatedText.includes("[") && (
                  <div style={{ margin: "0 1.25rem 1rem", padding: "0.625rem 0.875rem", borderRadius: "0.5rem", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", gap: "0.5rem" }}>
                    <span style={{ color:"#f59e0b", flexShrink:0 }}>✦</span>
                    <span style={{ fontSize:"0.8125rem", color:"var(--text-secondary)", lineHeight:1.5 }}>
                      <strong style={{ color:"#f59e0b" }}>[Variable Tags]</strong> found — personalise these before hitting send.
                    </span>
                  </div>
                )}

                {/* Copy button */}
                <div style={{ padding: "0 1.25rem 1.25rem" }}>
                  <button onClick={() => copyToClipboard(editMode ? editText : output.generatedText, setCopied)} style={{ width:"100%", padding:"0.75rem", borderRadius:"0.625rem", border:`1px solid ${copied ? "rgba(13,148,136,0.4)" : "var(--border)"}`, background: copied ? "rgba(13,148,136,0.07)" : "var(--bg-secondary)", color: copied ? "var(--secondary)" : "var(--text-secondary)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", fontSize:"0.875rem", fontWeight:600, transition:"all 0.15s" }}>
                    {copied ? <><Check size={15} /> Copied!</> : <><Copy size={15} /> Copy Message</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════ HISTORY TAB ═══════ */}
      {tab === "history" && (
        <div>
          {histLoading ? (
            <div style={{ padding:"3rem", textAlign:"center" }}><Dots /></div>
          ) : history.length === 0 ? (
            <div style={{ padding:"3rem 2rem", borderRadius:"1rem", background:"var(--bg-card)", border:"1px dashed var(--border)", textAlign:"center" }}>
              <Clock size={32} color="var(--text-muted)" style={{ margin:"0 auto 1rem" }} />
              <p style={{ fontWeight:600, color:"var(--text-primary)", marginBottom:"0.375rem" }}>No messages yet</p>
              <p style={{ fontSize:"0.875rem", color:"var(--text-secondary)" }}>Generate your first outreach message to see it here.</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
              {history.map(item => {
                const IIcon = TYPE_ICON[item.messageType] ?? Mail;
                return (
                  <div key={item.id} style={{ padding:"1.25rem 1.5rem", borderRadius:"0.875rem", background:"var(--bg-card)", border:"1px solid var(--border)", display:"flex", gap:"1.25rem", alignItems:"flex-start" }}>
                    <div style={{ flex:1, overflow:"hidden", minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.5rem", flexWrap:"wrap" }}>
                        <span style={{ fontSize:"0.7rem", fontWeight:700, padding:"0.2rem 0.5rem", borderRadius:"999px", background:TYPE_BG[item.messageType], color:TYPE_COLOR[item.messageType], display:"flex", alignItems:"center", gap:"0.25rem" }}>
                          <IIcon size={11} />
                          {MESSAGE_TYPES.find(t => t.value === item.messageType)?.label ?? item.messageType}
                        </span>
                        <span style={{ fontSize:"0.8125rem", fontWeight:600, color:"var(--text-primary)" }}>
                          {item.targetRole} @ {item.companyName}
                        </span>
                        <span style={{ fontSize:"0.75rem", color:"var(--text-muted)", marginLeft:"auto" }}>
                          {timeAgo(item.createdAt)}
                        </span>
                      </div>
                      {item.subject && (
                        <p style={{ fontSize:"0.875rem", fontWeight:600, color:"var(--text-secondary)", marginBottom:"0.375rem" }}>✉ {item.subject}</p>
                      )}
                      <p style={{ fontSize:"0.875rem", color:"var(--text-secondary)", lineHeight:1.6, overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>
                        {item.generatedText}
                      </p>
                    </div>
                    <div style={{ display:"flex", gap:"0.375rem", flexShrink:0 }}>
                      <ABtn onClick={() => loadFromHistory(item)} title="Load & view"><FileText size={13} /></ABtn>
                      <ABtn onClick={() => copyToClipboard(item.generatedText, setCopied)} title="Copy"><Copy size={13} /></ABtn>
                      <ABtn onClick={() => deleteMessage(item.id)} title="Delete" danger><Trash2 size={13} /></ABtn>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

const lbl: React.CSSProperties = { display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-secondary)", marginBottom:"0.375rem" };

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ padding:"1.25rem", borderRadius:"0.875rem", background:"var(--bg-card)", border:"1px solid var(--border)", display:"flex", flexDirection:"column", gap:"0.875rem" }}>{children}</div>;
}

function SLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"0.375rem" }}>
      <span style={{ color:"var(--text-muted)" }}>{icon}</span>
      <span style={{ fontSize:"0.725rem", fontWeight:700, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</span>
    </div>
  );
}

function FField({ label, placeholder, value, onChange, icon }: { label: string; placeholder: string; value: string; onChange: (v: string) => void; icon?: React.ReactNode }) {
  return (
    <div>
      <label style={lbl}>
        {icon && <span style={{ display:"inline", marginRight:"0.25rem", verticalAlign:"middle", color:"var(--text-muted)" }}>{icon}</span>}
        {label}
      </label>
      <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={inp} />
    </div>
  );
}

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position:"relative", display:"inline-block", marginLeft:"0.3rem", verticalAlign:"middle" }}>
      <span onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} style={{ cursor:"help", color:"var(--text-muted)", fontSize:"0.75rem" }}>ⓘ</span>
      {show && (
        <span style={{ position:"absolute", bottom:"130%", left:"50%", transform:"translateX(-50%)", background:"#1e293b", color:"#e2e8f0", fontSize:"0.75rem", padding:"0.5rem 0.75rem", borderRadius:"0.5rem", whiteSpace:"normal", width:"220px", lineHeight:1.55, zIndex:100, boxShadow:"0 4px 14px rgba(0,0,0,0.3)", pointerEvents:"none" }}>
          {text}
        </span>
      )}
    </span>
  );
}

function ABtn({ onClick, title, children, active, disabled, danger }: { onClick:()=>void; title:string; children:React.ReactNode; active?:boolean; disabled?:boolean; danger?:boolean }) {
  return (
    <button onClick={onClick} title={title} disabled={disabled} style={{ width:"30px", height:"30px", borderRadius:"0.375rem", border:`1px solid ${active ? "rgba(37,99,235,0.3)" : danger ? "rgba(239,68,68,0.2)" : "var(--border)"}`, background: active ? "var(--primary-light)" : "transparent", color: active ? "var(--primary)" : danger ? "#ef4444" : "var(--text-muted)", cursor: disabled ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", opacity: disabled ? 0.5 : 1, transition:"all 0.15s", flexShrink:0 }}>
      {children}
    </button>
  );
}

function Dots() {
  return (
    <div style={{ display:"inline-flex", gap:"4px" }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{ width:"6px", height:"6px", borderRadius:"50%", background:"linear-gradient(135deg,#2563EB,#0D9488)", animation:`bounce 1.2s ease-in-out ${i*0.15}s infinite` }} />
      ))}
    </div>
  );
}