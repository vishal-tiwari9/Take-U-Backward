// PATH: src/components/mentor/VoiceCallButton.tsx  — CREATE
// GSAP-animated voice call button for the Mentor dashboard.
// State machine: idle → requesting → ringing → live → ending → summary
// GSAP drives: button scale spring, waveform bars, overlay slide-in.
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";

// ─── Types ───────────────────────────────────────────────────────────
type CallState =
  | "idle"        // default — shows "Call ARIA" button
  | "input"       // phone number input drawer open
  | "requesting"  // POST in-flight to /api/mentor/voice/start
  | "ringing"     // call placed, waiting for pickup
  | "live"        // call connected — show waveform
  | "ending"      // user clicked end / call hung up
  | "summary";    // post-call — show extracted summary

interface CallSummary {
  summary:     string;
  actionItems: string[];
  keyInsights: string[];
  durationSeconds: number;
}

interface VoiceCallButtonProps {
  pillarId:   string;
  sessionId?: string | null;
  accent:     string;
  pillarLabel:string;
}

// ─── Country codes for the input ─────────────────────────────────────
const COUNTRY_CODES = [
  { code: "+91",  flag: "🇮🇳", name: "India"        },
  { code: "+1",   flag: "🇺🇸", name: "USA"          },
  { code: "+44",  flag: "🇬🇧", name: "UK"           },
  { code: "+61",  flag: "🇦🇺", name: "Australia"    },
  { code: "+65",  flag: "🇸🇬", name: "Singapore"    },
  { code: "+971", flag: "🇦🇪", name: "UAE"          },
  { code: "+49",  flag: "🇩🇪", name: "Germany"      },
  { code: "+33",  flag: "🇫🇷", name: "France"       },
];

// ─── Waveform component (5 GSAP-animated bars) ────────────────────────
function LiveWaveform({ accent, active }: { accent: string; active: boolean }) {
  const barsRef = useRef<HTMLDivElement[]>([]);
  const tlRef   = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (!active) {
      tlRef.current?.kill();
      barsRef.current.forEach(b => { if (b) gsap.to(b, { scaleY: 0.15, duration: 0.3 }); });
      return;
    }

    // Stagger bars with different durations for organic feel
    const durations = [0.6, 0.45, 0.75, 0.5, 0.65];
    tlRef.current = gsap.timeline({ repeat: -1 });

    barsRef.current.forEach((bar, i) => {
      if (!bar) return;
      // Each bar gets its own nested repeating tween offset by its index
      gsap.to(bar, {
        scaleY: () => 0.2 + Math.random() * 0.8,
        duration: durations[i % durations.length],
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: i * 0.08,
      });
    });

    return () => {
      barsRef.current.forEach(b => { if (b) gsap.killTweensOf(b); });
    };
  }, [active]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "28px" }}>
      {[0.55, 1.0, 0.75, 1.0, 0.55].map((_, i) => (
        <div
          key={i}
          ref={el => { if (el) barsRef.current[i] = el; }}
          style={{
            width: "3px",
            height: "100%",
            background: accent,
            borderRadius: "2px",
            transformOrigin: "bottom",
            transform: "scaleY(0.15)",
            boxShadow: `0 0 6px ${accent}88`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Timer display ────────────────────────────────────────────────────
function CallTimer({ running }: { running: boolean }) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      setSeconds(0);
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");

  return (
    <span style={{ fontFamily: "'Orbitron',monospace", fontSize: "0.72rem",
      letterSpacing: "0.12em", color: "rgba(255,255,255,0.6)" }}>
      {mm}:{ss}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────
export default function VoiceCallButton({
  pillarId, sessionId, accent, pillarLabel,
}: VoiceCallButtonProps) {
  const [callState,    setCallState]    = useState<CallState>("idle");
  const [countryCode,  setCountryCode]  = useState("+91");
  const [phoneNum,     setPhoneNum]     = useState("");
  const [error,        setError]        = useState<string | null>(null);
  const [callId,       setCallId]       = useState<string | null>(null);
  const [summary,      setSummary]      = useState<CallSummary | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const btnRef     = useRef<HTMLButtonElement>(null);
  const inputBoxRef= useRef<HTMLDivElement>(null);
  const ringingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── GSAP: spring entrance for overlay ────────────────────────────
  const showOverlay = useCallback(() => {
    if (!overlayRef.current) return;
    gsap.fromTo(overlayRef.current,
      { opacity: 0, scale: 0.93, y: 12 },
      { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "back.out(1.6)" }
    );
  }, []);

  useEffect(() => {
    if (callState === "input" || callState === "summary") showOverlay();
  }, [callState, showOverlay]);

  // ── GSAP: button pulse when ringing ──────────────────────────────
  useEffect(() => {
    if (!btnRef.current) return;
    if (callState === "ringing") {
      gsap.to(btnRef.current, {
        boxShadow: `0 0 0 6px ${accent}44, 0 0 24px ${accent}66`,
        scale: 1.05,
        duration: 0.7,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    } else {
      gsap.killTweensOf(btnRef.current);
      gsap.to(btnRef.current, { boxShadow: "none", scale: 1, duration: 0.25 });
    }
  }, [callState, accent]);

  // ── Simulate ringing → live transition (Vapi typically picks up in ~4s) ──
  useEffect(() => {
    if (callState === "ringing") {
      ringingRef.current = setTimeout(() => {
        setCallState("live");
      }, 4500);
    }
    return () => { if (ringingRef.current) clearTimeout(ringingRef.current); };
  }, [callState]);

  // ── Start call ────────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    const digits = phoneNum.replace(/\D/g, "");
    if (digits.length < 7) {
      setError("Please enter a valid phone number.");
      return;
    }
    setError(null);
    setCallState("requesting");

    // GSAP: shake button on submit
    if (btnRef.current) {
      gsap.fromTo(btnRef.current,
        { x: -3 },
        { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" }
      );
    }

    try {
      const e164 = `${countryCode}${digits}`;
      const res = await fetch("/api/mentor/voice/start", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: e164, pillarId, sessionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Call failed");
      }

      setCallId(data.callId);
      setCallState("ringing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not place call.");
      setCallState("input");
    }
  }, [phoneNum, countryCode, pillarId, sessionId]);

  // ── End call ──────────────────────────────────────────────────────
  const endCall = useCallback(async () => {
    setCallState("ending");

    // GSAP: shrink the live panel out
    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 0, scale: 0.95, y: 8,
        duration: 0.3, ease: "power2.in",
        onComplete: () => {
          // Transition to summary state (real summary comes via webhook;
          // we show a placeholder that updates when the DB write completes)
          setSummary({
            summary:    "Your call with ARIA has ended. A full summary will appear here once processing completes (usually within 30 seconds).",
            actionItems:["Check back shortly for your personalised action items."],
            keyInsights:[],
            durationSeconds: 0,
          });
          setCallState("summary");
        },
      });
    }

    // Optionally: call Vapi REST API to hang up programmatically
    if (callId) {
      fetch(`https://api.vapi.ai/call/${callId}`, {
        method:  "DELETE",
        headers: { "Authorization": `Bearer ${process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY ?? ""}` },
      }).catch(() => { /* best-effort */ });
    }
  }, [callId]);

  // ── Poll for summary after call ends ─────────────────────────────
  useEffect(() => {
    if (callState !== "summary" || !sessionId) return;
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const r = await fetch(`/api/mentor/sessions?limit=1`);
        const d = await r.json();
        const latest = d.sessions?.[0];
        if (latest?.content?.type === "voice_call" && latest.content.summary) {
          const c = latest.content;
          setSummary({
            summary:         c.summary,
            actionItems:     c.actionItems ?? [],
            keyInsights:     c.keyInsights ?? [],
            durationSeconds: c.durationSeconds ?? 0,
          });
          clearInterval(poll);
        }
      } catch { /* silent */ }
      if (attempts >= 10) clearInterval(poll); // stop after ~50s
    }, 5000);
    return () => clearInterval(poll);
  }, [callState, sessionId]);

  // ─── Render ──────────────────────────────────────────────────────
  const isActive = callState !== "idle";

  return (
    <div style={{ position: "relative", display: "inline-block" }}>

      {/* ── Trigger button ─────────────────────────────────────── */}
      {(callState === "idle" || callState === "requesting") && (
        <button
          ref={btnRef}
          onClick={() => setCallState("input")}
          disabled={callState === "requesting"}
          style={{
            display: "flex", alignItems: "center", gap: "0.45rem",
            padding: "0.42rem 0.875rem", borderRadius: "0.5rem", border: "none",
            background: `linear-gradient(135deg, ${accent}dd, ${accent}88)`,
            color: "#fff", fontSize: "0.72rem", fontFamily: "'DM Sans',sans-serif",
            fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em",
            transition: "filter 0.2s",
            boxShadow: `0 0 14px ${accent}44`,
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.filter = "brightness(1.2)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter = "brightness(1)"}
        >
          <PhoneIcon size={13} />
          {callState === "requesting" ? "Connecting…" : "Call ARIA"}
        </button>
      )}

      {/* ── Ringing indicator ──────────────────────────────────── */}
      {callState === "ringing" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.42rem 0.875rem", borderRadius: "0.5rem",
          background: `${accent}18`, border: `1px solid ${accent}45` }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: accent,
            animation: "callPulse 0.9s ease-in-out infinite",
            boxShadow: `0 0 8px ${accent}` }} />
          <span style={{ fontSize: "0.72rem", color: accent, fontWeight: 700,
            letterSpacing: "0.06em", fontFamily: "'DM Sans',sans-serif" }}>Ringing…</span>
          <style>{`@keyframes callPulse { 0%,100%{opacity:.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1.2)} }`}</style>
        </div>
      )}

      {/* ── Live call bar ───────────────────────────────────────── */}
      {callState === "live" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "0.42rem 0.875rem", borderRadius: "0.5rem",
          background: `${accent}14`, border: `1px solid ${accent}40`,
          boxShadow: `0 0 18px ${accent}22` }}>
          {/* Red dot */}
          <div style={{ width: 7, height: 7, borderRadius: "50%",
            background: "#ef4444", animation: "livePulse 1.4s ease infinite",
            boxShadow: "0 0 8px #ef4444" }} />
          <span style={{ fontSize: "0.65rem", color: "#ef4444", fontWeight: 700,
            letterSpacing: "0.1em", fontFamily: "'Orbitron',monospace" }}>LIVE</span>
          <LiveWaveform accent={accent} active={true} />
          <CallTimer running={true} />
          <button onClick={endCall}
            style={{ padding: "0.2rem 0.55rem", borderRadius: "0.3rem", border: "1px solid #ef444440",
              background: "#ef444414", color: "#ef4444", fontSize: "0.65rem", cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif", fontWeight: 600, letterSpacing: "0.06em" }}>
            End
          </button>
          <style>{`@keyframes livePulse { 0%,100%{opacity:.5} 50%{opacity:1} }`}</style>
        </div>
      )}

      {/* ── Ending ─────────────────────────────────────────────── */}
      {callState === "ending" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem",
          padding: "0.42rem 0.875rem", borderRadius: "0.5rem",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)",
            fontFamily: "'DM Sans',sans-serif" }}>Ending call…</span>
        </div>
      )}

      {/* ── Summary badge ──────────────────────────────────────── */}
      {callState === "summary" && (
        <button onClick={() => setCallState("summary")}
          style={{ display: "flex", alignItems: "center", gap: "0.4rem",
            padding: "0.42rem 0.875rem", borderRadius: "0.5rem",
            background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.35)",
            color: "#34d399", fontSize: "0.72rem", cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif", fontWeight: 700, letterSpacing: "0.06em" }}>
          ✓ Call Summary
        </button>
      )}

      {/* ── Input overlay: phone number entry ──────────────────── */}
      {callState === "input" && (
        <div ref={overlayRef}
          style={{ position: "absolute", top: "calc(100% + 10px)", right: 0,
            zIndex: 50, width: 320,
            background: "rgba(8,4,20,0.97)", backdropFilter: "blur(24px)",
            border: `1px solid ${accent}35`, borderRadius: "1rem",
            padding: "1.25rem", boxShadow: `0 12px 48px rgba(0,0,0,0.7), 0 0 0 1px ${accent}18` }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: "0.62rem", color: accent,
                letterSpacing: "0.15em", marginBottom: "0.2rem" }}>VOICE CALL</div>
              <h3 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 600, color: "#fff",
                fontFamily: "'DM Sans',sans-serif" }}>Call ARIA — {pillarLabel}</h3>
            </div>
            <button onClick={() => setCallState("idle")}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.375rem", color: "rgba(255,255,255,0.4)", cursor: "pointer",
                padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}>✕</button>
          </div>

          {/* Info badge */}
          <div style={{ marginBottom: "1rem", padding: "0.5rem 0.75rem",
            background: `${accent}0d`, border: `1px solid ${accent}22`, borderRadius: "0.5rem" }}>
            <p style={{ margin: 0, fontSize: "0.73rem", color: "rgba(255,255,255,0.5)",
              lineHeight: 1.6, fontFamily: "'DM Sans',sans-serif" }}>
              ARIA will call you in ~5 seconds. The call uses{" "}
              <span style={{ color: accent }}>ElevenLabs TTS + Deepgram STT</span>{" "}
              for near-zero latency. Standard call rates apply.
            </p>
          </div>

          {/* Phone input */}
          <div style={{ marginBottom: "0.875rem" }}>
            <label style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)",
              letterSpacing: "0.12em", textTransform: "uppercase", display: "block",
              marginBottom: "0.4rem", fontFamily: "'DM Sans',sans-serif" }}>
              Your Phone Number
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {/* Country code selector */}
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                style={{ padding: "0.55rem 0.5rem", borderRadius: "0.5rem",
                  background: "rgba(255,255,255,0.06)", border: `1px solid ${accent}25`,
                  color: "#fff", fontSize: "0.78rem", cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif", flexShrink: 0, outline: "none" }}>
                {COUNTRY_CODES.map(c => (
                  <option key={c.code} value={c.code} style={{ background: "#0a0414" }}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              {/* Number input */}
              <input
                type="tel"
                value={phoneNum}
                onChange={e => setPhoneNum(e.target.value.replace(/[^\d\s\-()]/g, ""))}
                onKeyDown={e => { if (e.key === "Enter") startCall(); }}
                placeholder="98765 43210"
                autoFocus
                style={{ flex: 1, padding: "0.55rem 0.75rem", borderRadius: "0.5rem",
                  background: "rgba(255,255,255,0.06)", border: `1px solid ${accent}25`,
                  color: "#fff", fontSize: "0.88rem", fontFamily: "'DM Sans',sans-serif",
                  outline: "none", transition: "border-color .2s" }}
                onFocus={e => (e.target as HTMLElement).style.borderColor = accent}
                onBlur={e => (e.target as HTMLElement).style.borderColor = `${accent}25`}
              />
            </div>
            {error && (
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.72rem", color: "#f87171",
                fontFamily: "'DM Sans',sans-serif" }}>{error}</p>
            )}
          </div>

          {/* Vapi tech stack badges */}
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            {["🔊 ElevenLabs TTS", "👂 Deepgram STT", "🧠 Llama 3.3", "📞 Vapi + Twilio"].map(badge => (
              <span key={badge} style={{ fontSize: "0.58rem", padding: "0.12rem 0.45rem",
                borderRadius: "999px", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)" }}>
                {badge}
              </span>
            ))}
          </div>

          {/* Call button */}
          <button onClick={startCall}
            style={{ width: "100%", padding: "0.7rem", borderRadius: "0.6rem", border: "none",
              background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
              color: "#fff", fontSize: "0.88rem", fontFamily: "'DM Sans',sans-serif",
              fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em",
              boxShadow: `0 0 20px ${accent}44`, transition: "filter .2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.filter = "brightness(1.15)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter = "brightness(1)"}>
            <PhoneIcon size={16} />
            Place Call Now
          </button>

          <p style={{ margin: "0.625rem 0 0", fontSize: "0.65rem", color: "rgba(255,255,255,0.2)",
            textAlign: "center", fontFamily: "'DM Sans',sans-serif", lineHeight: 1.5 }}>
            By calling, you confirm you are authorised to receive calls at this number.
          </p>
        </div>
      )}

      {/* ── Post-call summary overlay ────────────────────────────── */}
      {callState === "summary" && summary && (
        <div ref={overlayRef}
          style={{ position: "absolute", top: "calc(100% + 10px)", right: 0,
            zIndex: 50, width: 340,
            background: "rgba(8,4,20,0.97)", backdropFilter: "blur(24px)",
            border: "1px solid rgba(52,211,153,0.3)", borderRadius: "1rem",
            padding: "1.25rem", boxShadow: "0 12px 48px rgba(0,0,0,0.7)" }}>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontFamily: "'Orbitron',monospace", fontSize: "0.6rem", color: "#34d399",
                letterSpacing: "0.15em", marginBottom: "0.2rem" }}>CALL COMPLETE</div>
              <h3 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 600, color: "#fff",
                fontFamily: "'DM Sans',sans-serif" }}>ARIA's Summary</h3>
            </div>
            <button onClick={() => setCallState("idle")}
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.375rem", color: "rgba(255,255,255,0.4)", cursor: "pointer",
                padding: "0.2rem 0.5rem", fontSize: "0.75rem" }}>✕</button>
          </div>

          {/* Summary */}
          <div style={{ marginBottom: "0.875rem", padding: "0.75rem 0.875rem",
            background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.18)",
            borderRadius: "0.625rem" }}>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.72)",
              lineHeight: 1.7, fontFamily: "'DM Sans',sans-serif" }}>
              {summary.summary}
            </p>
          </div>

          {/* Action items */}
          {summary.actionItems.length > 0 && (
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "0.58rem", color: "#34d399", letterSpacing: "0.15em",
                textTransform: "uppercase", fontWeight: 700, marginBottom: "0.4rem",
                fontFamily: "'Orbitron',monospace" }}>Action Items</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                {summary.actionItems.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <span style={{ color: "#34d399", fontSize: "0.78rem", flexShrink: 0, marginTop: "0.1rem" }}>✓</span>
                    <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.65)",
                      lineHeight: 1.55, fontFamily: "'DM Sans',sans-serif" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key insights */}
          {summary.keyInsights.length > 0 && (
            <div style={{ marginBottom: "0.875rem" }}>
              <div style={{ fontSize: "0.58rem", color: "#a78bfa", letterSpacing: "0.15em",
                textTransform: "uppercase", fontWeight: 700, marginBottom: "0.4rem",
                fontFamily: "'Orbitron',monospace" }}>Key Insights</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                {summary.keyInsights.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
                    <span style={{ color: "#a78bfa", fontSize: "0.78rem", flexShrink: 0, marginTop: "0.1rem" }}>◈</span>
                    <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)",
                      lineHeight: 1.55, fontFamily: "'DM Sans',sans-serif" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setCallState("idle")}
            style={{ width: "100%", padding: "0.55rem", borderRadius: "0.5rem",
              background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)",
              color: "#34d399", fontSize: "0.78rem", fontFamily: "'DM Sans',sans-serif",
              fontWeight: 600, cursor: "pointer", letterSpacing: "0.06em" }}>
            Start Another Call
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Inline phone SVG icon ────────────────────────────────────────────
function PhoneIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
    </svg>
  );
}