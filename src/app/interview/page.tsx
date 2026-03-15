"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Mic,
  MicOff,
  ChevronLeft,
  Code2,
  MessageSquare,
  Clock,
  Loader2,
  Terminal,
  User,
  Bot,
  Volume2,
  VolumeX,
  Radio,
} from "lucide-react";
import { useRouter } from "next/navigation";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#0d1117" }}>
      <Loader2 size={20} color="#8b949e" style={{ animation: "spin 1s linear infinite" }} />
    </div>
  ),
});

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface Config {
  role: string;
  techStack: string;
}

const TOTAL_TIME = 45 * 60;
const PHASE_2_START = 35 * 60;
const PHASE_3_START = 20 * 60;

const phaseConfig = {
  1: { label: "Phase 1 — Basics", color: "#2dd4bf", bg: "rgba(45,212,191,0.1)", border: "rgba(45,212,191,0.25)", desc: "Introduction & Basic CS" },
  2: { label: "Phase 2 — Advanced", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", desc: "Deep Theory & Architecture" },
  3: { label: "Phase 3 — Live Coding", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)", desc: "DSA Problem Solving" },
};

const LANGUAGE_OPTIONS = ["javascript", "typescript", "python", "java", "cpp", "go", "rust"];

const STARTER_CODE: Record<string, string> = {
  javascript: "// Start coding here\nfunction solution() {\n  \n}\n",
  typescript: "// Start coding here\nfunction solution(): void {\n  \n}\n",
  python: "# Start coding here\ndef solution():\n    pass\n",
  java: "// Start coding here\npublic class Solution {\n    public void solve() {\n        \n    }\n}\n",
  cpp: "// Start coding here\n#include <vector>\nusing namespace std;\n\nvoid solution() {\n    \n}\n",
  go: "// Start coding here\npackage main\n\nfunc solution() {\n\t\n}\n",
  rust: "// Start coding here\nfn solution() {\n    \n}\n",
};

type RecordingState = "idle" | "recording" | "transcribing" | "thinking" | "speaking";

export default function FAAngInterviewPage() {
  const router = useRouter();

  // Setup
  const [setupDone, setSetupDone] = useState(false);
  const [config, setConfig] = useState<Config>({ role: "", techStack: "" });
  const [setupLoading, setSetupLoading] = useState(false);

  // Interview
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentCode, setCurrentCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Recording state machine
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [transcript, setTranscript] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const prevPhaseRef = useRef(1);

  const currentPhase: 1 | 2 | 3 =
    timeRemaining > PHASE_2_START ? 1 : timeRemaining > PHASE_3_START ? 2 : 3;

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, recordingState]);

  // Countdown timer
  useEffect(() => {
    if (!started || ended) return;
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setEnded(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [started, ended]);

  // Phase transition message
  useEffect(() => {
    if (!started || prevPhaseRef.current === currentPhase) return;
    prevPhaseRef.current = currentPhase;
    const pc = phaseConfig[currentPhase];
    const msg: Message = {
      role: "assistant",
      content: `We're moving into ${pc.label} — ${pc.desc}. Let's continue.`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    if (voiceEnabled) {
        playTTS(msg.content);
    } else {
        setRecordingState("idle");
    }
  }, [currentPhase, started, voiceEnabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioRef.current?.pause();
      clearInterval(timerRef.current!);
      clearInterval(recordingTimerRef.current!);
    };
  }, []);

  // ── TTS: text → ElevenLabs → play audio ──
  async function playTTS(text: string) {
    if (!voiceEnabled) return;
    try {
      audioRef.current?.pause();
      setRecordingState("speaking");

      const res = await fetch("/api/interview/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        setRecordingState("idle");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        setRecordingState("idle");
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        setRecordingState("idle");
      };

      await audio.play();
    } catch {
      setRecordingState("idle");
    }
  }

  // ── Send message through full pipeline ──
  const sendToGroq = useCallback(
    async (userText: string) => {
      if (!userText.trim()) {
        setRecordingState("idle");
        return;
      }

      const userMsg: Message = {
        role: "user",
        content: userText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setRecordingState("thinking");

      const res = await fetch("/api/interview/faang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage: userText,
          currentCode: currentPhase === 3 ? currentCode : "",
          currentPhase,
          timeRemaining,
          conversationHistory: messages.slice(-12),
          role: config.role,
          techStack: config.techStack,
        }),
      });

      const data = await res.json();
      const aiText =
        data.response ?? "I encountered an issue. Could you repeat that?";

      const aiMsg: Message = {
        role: "assistant",
        content: aiText,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (voiceEnabled) {
        await playTTS(aiText);
      } else {
        setRecordingState("idle");
      }
    },
    [currentCode, currentPhase, timeRemaining, messages, config, voiceEnabled]
  );

  // ── STT: record → Groq Whisper → transcript ──
  async function startRecording() {
    if (recordingState !== "idle") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(recordingTimerRef.current!);
        setRecordingSeconds(0);

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        if (audioBlob.size < 1000) {
          setRecordingState("idle");
          return;
        }

        setRecordingState("transcribing");

        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");

        const res = await fetch("/api/interview/stt", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        const text = data.transcript?.trim() ?? "";
        setTranscript(text);

        if (text) {
          await sendToGroq(text);
          setTranscript("");
        } else {
          setRecordingState("idle");
        }
      };

      recorder.start(250);
      setRecordingState("recording");
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setRecordingState("idle");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }

  function stopAI() {
    audioRef.current?.pause();
    audioRef.current = null;
    setRecordingState("idle");
  }

  // ── Start interview ──
  async function handleStart() {
    if (!config.role) return;
    setSetupLoading(true);
    setSetupDone(true);
    setStarted(true);
    setSetupLoading(false);

    setRecordingState("thinking");

    const res = await fetch("/api/interview/faang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userMessage: "Hello, I am ready to begin the interview.",
        currentCode: "",
        currentPhase: 1,
        timeRemaining: TOTAL_TIME,
        conversationHistory: [],
        role: config.role,
        techStack: config.techStack,
      }),
    });

    const data = await res.json();
    const aiText = data.response ?? "Welcome! Let's get started.";

    const openingUser: Message = {
      role: "user",
      content: "Hello, I am ready to begin the interview.",
      timestamp: Date.now() - 100,
    };
    const openingAI: Message = {
      role: "assistant",
      content: aiText,
      timestamp: Date.now(),
    };
    setMessages([openingUser, openingAI]);

    if (voiceEnabled) {
      await playTTS(aiText);
    } else {
      setRecordingState("idle");
    }
  }

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }

  const timerColor =
    timeRemaining > PHASE_2_START
      ? "#2dd4bf"
      : timeRemaining > PHASE_3_START
      ? "#f59e0b"
      : "#ef4444";

  const pc = phaseConfig[currentPhase];

  const isProcessing =
    recordingState === "transcribing" ||
    recordingState === "thinking" ||
    recordingState === "speaking";

  // ── Status label ──
  function getStatusLabel() {
    switch (recordingState) {
      case "recording":
        return `🔴 Recording... ${recordingSeconds}s (release to send)`;
      case "transcribing":
        return "✦ Transcribing with Whisper...";
      case "thinking":
        return "✦ AI is thinking...";
      case "speaking":
        return "🔊 Interviewer is speaking... (click to interrupt)";
      case "idle":
        return transcript
          ? `"${transcript}"`
          : "Hold the mic button to speak";
    }
  }

  // ── SETUP SCREEN ──
  if (!setupDone) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d1117",
          fontFamily: "DM Sans, sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ width: "100%", maxWidth: "520px" }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              background: "none",
              border: "none",
              color: "#8b949e",
              fontSize: "0.875rem",
              cursor: "pointer",
              marginBottom: "2rem",
            }}
          >
            <ChevronLeft size={16} /> Back to Dashboard
          </button>

          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div
              style={{
                width: "60px",
                height: "60px",
                borderRadius: "18px",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <Code2 size={30} color="#0d1117" />
            </div>
            <h1
              style={{
                fontFamily: "Sora, sans-serif",
                fontSize: "1.75rem",
                fontWeight: 800,
                marginBottom: "0.5rem",
                color: "#e6edf3",
              }}
            >
              FAANG Interview Simulator
            </h1>
            <p style={{ color: "#8b949e", fontSize: "0.9375rem", marginBottom: "0.375rem" }}>
              45-minute structured interview · Voice-to-Voice AI
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.375rem 0.875rem", borderRadius: "999px", backgroundColor: "rgba(45,212,191,0.08)", border: "1px solid rgba(45,212,191,0.2)", marginTop: "0.5rem" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#2dd4bf", display: "inline-block" }} />
              <span style={{ fontSize: "0.8rem", color: "#2dd4bf", fontWeight: 600 }}>
                Powered by Groq Whisper + ElevenLabs
              </span>
            </div>
          </div>

          <div
            style={{
              padding: "1.75rem",
              borderRadius: "1rem",
              backgroundColor: "#161b22",
              border: "1px solid #30363d",
              marginBottom: "1rem",
            }}
          >
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#8b949e", marginBottom: "0.5rem" }}>
                Target Role *
              </label>
              <input
                type="text"
                placeholder="Software Engineer, Frontend Dev, SRE..."
                value={config.role}
                onChange={(e) => setConfig((p) => ({ ...p, role: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && config.role && handleStart()}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  backgroundColor: "#0d1117",
                  border: "1px solid #30363d",
                  borderRadius: "0.5rem",
                  color: "#e6edf3",
                  fontSize: "0.9rem",
                  outline: "none",
                  fontFamily: "DM Sans, sans-serif",
                }}
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#8b949e", marginBottom: "0.5rem" }}>
                Primary Language / Stack
              </label>
              <input
                type="text"
                placeholder="JavaScript, Python, Go, Java..."
                value={config.techStack}
                onChange={(e) => setConfig((p) => ({ ...p, techStack: e.target.value }))}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  backgroundColor: "#0d1117",
                  border: "1px solid #30363d",
                  borderRadius: "0.5rem",
                  color: "#e6edf3",
                  fontSize: "0.9rem",
                  outline: "none",
                  fontFamily: "DM Sans, sans-serif",
                }}
              />
            </div>

            {/* Phase timeline */}
            <div
              style={{
                padding: "1rem",
                borderRadius: "0.75rem",
                backgroundColor: "#0d1117",
                border: "1px solid #30363d",
                marginBottom: "1.5rem",
              }}
            >
              <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#8b949e", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "0.875rem" }}>
                Interview Structure
              </p>
              {[
                { phase: "Phase 1", time: "0 – 10 min", label: "Basics & Intro", color: "#2dd4bf" },
                { phase: "Phase 2", time: "10 – 25 min", label: "Advanced Theory", color: "#f59e0b" },
                { phase: "Phase 3", time: "25 – 45 min", label: "Live DSA Coding", color: "#ef4444" },
              ].map((p) => (
                <div key={p.phase} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.625rem" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: p.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: p.color, width: "68px", flexShrink: 0 }}>{p.phase}</span>
                  <span style={{ fontSize: "0.8rem", color: "#6e7681", width: "90px", flexShrink: 0 }}>{p.time}</span>
                  <span style={{ fontSize: "0.8rem", color: "#e6edf3" }}>{p.label}</span>
                </div>
              ))}
            </div>

            {/* Voice toggle */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <button
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                style={{
                  flex: 1,
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: `1px solid ${voiceEnabled ? "rgba(245,158,11,0.4)" : "#30363d"}`,
                  background: voiceEnabled ? "rgba(245,158,11,0.08)" : "none",
                  color: voiceEnabled ? "#f59e0b" : "#8b949e",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  fontWeight: 600,
                  transition: "all 0.15s",
                }}
              >
                {voiceEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                {voiceEnabled ? "AI Voice: ON (ElevenLabs)" : "AI Voice: OFF (text only)"}
              </button>
            </div>

            <button
              onClick={handleStart}
              disabled={!config.role || setupLoading}
              style={{
                width: "100%",
                padding: "1rem",
                borderRadius: "0.75rem",
                border: "none",
                cursor: !config.role ? "not-allowed" : "pointer",
                opacity: !config.role ? 0.6 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.625rem",
                fontSize: "1rem",
                fontWeight: 700,
                fontFamily: "Sora, sans-serif",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#0d1117",
                transition: "opacity 0.2s",
              }}
            >
              {setupLoading ? (
                <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Starting...</>
              ) : (
                <><Mic size={18} /> Begin Interview</>
              )}
            </button>
          </div>

          <p style={{ fontSize: "0.75rem", color: "#6e7681", textAlign: "center" }}>
            Requires microphone permission · Works best in Chrome or Edge
          </p>
        </div>
      </div>
    );
  }

  // ── ENDED SCREEN ──
  if (ended) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0d1117",
          fontFamily: "DM Sans, sans-serif",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: "480px" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>⏱️</div>
          <h2
            style={{
              fontFamily: "Sora, sans-serif",
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "#e6edf3",
              marginBottom: "0.5rem",
            }}
          >
            Time&apos;s Up!
          </h2>
          <p style={{ color: "#8b949e", fontSize: "0.9375rem", marginBottom: "0.375rem" }}>
            You completed {Math.floor(messages.filter((m) => m.role === "user").length)} responses across all 3 phases.
          </p>
          <p style={{ color: "#6e7681", fontSize: "0.875rem", marginBottom: "2rem", lineHeight: 1.6 }}>
            Real FAANG interviews are exactly this structured. Keep practising and you&apos;ll get there.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button
              onClick={() => {
                setSetupDone(false);
                setStarted(false);
                setEnded(false);
                setMessages([]);
                setTimeRemaining(TOTAL_TIME);
                setCurrentCode("");
                setRecordingState("idle");
                prevPhaseRef.current = 1;
              }}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.75rem",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                border: "none",
                color: "#0d1117",
                fontWeight: 700,
                cursor: "pointer",
                fontSize: "0.9375rem",
                fontFamily: "Sora, sans-serif",
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.75rem",
                border: "1px solid #30363d",
                background: "none",
                color: "#8b949e",
                fontWeight: 500,
                cursor: "pointer",
                fontSize: "0.9375rem",
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN INTERVIEW UI ──
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0d1117",
        fontFamily: "DM Sans, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          height: "52px",
          backgroundColor: "#161b22",
          borderBottom: "1px solid #30363d",
          display: "flex",
          alignItems: "center",
          padding: "0 1.25rem",
          gap: "0.875rem",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.25rem",
            background: "none",
            border: "none",
            color: "#8b949e",
            fontSize: "0.8125rem",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <ChevronLeft size={15} /> Exit
        </button>

        <div style={{ width: "1px", height: "20px", backgroundColor: "#30363d" }} />

        {/* Phase pill */}
        <div
          style={{
            padding: "0.25rem 0.875rem",
            borderRadius: "999px",
            backgroundColor: pc.bg,
            border: `1px solid ${pc.border}`,
            color: pc.color,
            fontSize: "0.75rem",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          {pc.label}
        </div>

        <span style={{ fontSize: "0.8rem", color: "#6e7681", display: "none" }}>
          {pc.desc}
        </span>

        <div style={{ flex: 1 }} />

        {/* Voice status indicator */}
        {recordingState === "speaking" && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.25rem 0.75rem", borderRadius: "999px", backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
            <Radio size={12} color="#f59e0b" style={{ animation: "pulse 1s infinite" }} />
            <span style={{ fontSize: "0.75rem", color: "#f59e0b", fontWeight: 600 }}>AI Speaking</span>
          </div>
        )}

        {recordingState === "recording" && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.25rem 0.75rem", borderRadius: "999px", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#ef4444", animation: "pulse 0.8s infinite" }} />
            <span style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 600 }}>{recordingSeconds}s</span>
          </div>
        )}

        {/* Voice toggle */}
        <button
          onClick={() => {
            if (recordingState === "speaking") stopAI();
            setVoiceEnabled(!voiceEnabled);
          }}
          title={voiceEnabled ? "Mute AI voice" : "Enable AI voice"}
          style={{
            background: "none",
            border: "none",
            color: voiceEnabled ? "#f59e0b" : "#8b949e",
            cursor: "pointer",
            padding: "0.375rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {/* Timer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.375rem 0.875rem",
            borderRadius: "0.5rem",
            backgroundColor: `${timerColor}12`,
            border: `1px solid ${timerColor}30`,
          }}
        >
          <Clock size={14} color={timerColor} />
          <span
            style={{
              fontFamily: "Sora, sans-serif",
              fontWeight: 800,
              fontSize: "1.0625rem",
              color: timerColor,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatTime(timeRemaining)}
          </span>
        </div>

        {/* Timer bar */}
        <div style={{ width: "60px", height: "4px", backgroundColor: "#30363d", borderRadius: "2px", overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${(timeRemaining / TOTAL_TIME) * 100}%`,
              backgroundColor: timerColor,
              borderRadius: "2px",
              transition: "width 1s linear, background-color 0.5s",
            }}
          />
        </div>

        <span style={{ fontSize: "0.8rem", color: "#8b949e", whiteSpace: "nowrap" }}>
          {config.role}
        </span>
      </div>

      {/* ── Main split layout ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT — Chat + Voice input */}
        <div
          style={{
            width: "44%",
            minWidth: "380px",
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid #30363d",
          }}
        >
          {/* Chat header */}
          <div
            style={{
              padding: "0.625rem 1.25rem",
              borderBottom: "1px solid #30363d",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexShrink: 0,
              backgroundColor: "#161b22",
            }}
          >
            <MessageSquare size={14} color="#8b949e" />
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#8b949e" }}>
              Conversation
            </span>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: "0.75rem", color: "#6e7681" }}>
              {messages.length} messages
            </span>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "0.625rem",
                  alignItems: "flex-start",
                  flexDirection: msg.role === "user" ? "row-reverse" : "row",
                }}
              >
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    backgroundColor:
                      msg.role === "user"
                        ? "rgba(45,212,191,0.12)"
                        : "rgba(245,158,11,0.12)",
                    border: `1px solid ${msg.role === "user" ? "rgba(45,212,191,0.25)" : "rgba(245,158,11,0.25)"}`,
                  }}
                >
                  {msg.role === "user" ? (
                    <User size={14} color="#2dd4bf" />
                  ) : (
                    <Bot size={14} color="#f59e0b" />
                  )}
                </div>

                <div
                  style={{
                    maxWidth: "82%",
                    padding: "0.75rem 1rem",
                    borderRadius:
                      msg.role === "user"
                        ? "1rem 0.25rem 1rem 1rem"
                        : "0.25rem 1rem 1rem 1rem",
                    backgroundColor:
                      msg.role === "user" ? "rgba(45,212,191,0.07)" : "#161b22",
                    border: `1px solid ${msg.role === "user" ? "rgba(45,212,191,0.18)" : "#30363d"}`,
                    fontSize: "0.9rem",
                    color: "#e6edf3",
                    lineHeight: 1.65,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Status bubble */}
            {isProcessing && (
              <div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(245,158,11,0.12)",
                    border: "1px solid rgba(245,158,11,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Bot size={14} color="#f59e0b" />
                </div>
                <div
                  style={{
                    padding: "0.625rem 1rem",
                    borderRadius: "0.25rem 1rem 1rem 1rem",
                    backgroundColor: "#161b22",
                    border: "1px solid #30363d",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {recordingState === "transcribing" && (
                    <><Loader2 size={14} color="#2dd4bf" style={{ animation: "spin 1s linear infinite" }} /><span style={{ fontSize: "0.875rem", color: "#8b949e" }}>Transcribing...</span></>
                  )}
                  {recordingState === "thinking" && (
                    <><Loader2 size={14} color="#f59e0b" style={{ animation: "spin 1s linear infinite" }} /><span style={{ fontSize: "0.875rem", color: "#8b949e" }}>Thinking...</span></>
                  )}
                  {recordingState === "speaking" && (
                    <><Radio size={14} color="#f59e0b" style={{ animation: "pulse 1s infinite" }} /><span style={{ fontSize: "0.875rem", color: "#8b949e" }}>Speaking via ElevenLabs...</span></>
                  )}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* ── Voice input area ── */}
          <div
            style={{
              padding: "1.25rem",
              borderTop: "1px solid #30363d",
              flexShrink: 0,
              backgroundColor: "#0d1117",
            }}
          >
            {/* Status text */}
            <p
              style={{
                fontSize: "0.8125rem",
                color: recordingState === "recording" ? "#ef4444" : recordingState === "speaking" ? "#f59e0b" : "#8b949e",
                textAlign: "center",
                marginBottom: "1rem",
                minHeight: "18px",
                fontWeight: recordingState !== "idle" ? 600 : 400,
              }}
            >
              {getStatusLabel()}
            </p>

            {/* Mic button */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                onClick={recordingState === "speaking" ? stopAI : undefined}
                disabled={recordingState === "transcribing" || recordingState === "thinking"}
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "50%",
                  border: "none",
                  cursor:
                    recordingState === "transcribing" || recordingState === "thinking"
                      ? "not-allowed"
                      : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                  background:
                    recordingState === "recording"
                      ? "radial-gradient(circle, #ef4444, #dc2626)"
                      : recordingState === "speaking"
                      ? "radial-gradient(circle, #f59e0b, #d97706)"
                      : recordingState === "transcribing" || recordingState === "thinking"
                      ? "radial-gradient(circle, #374151, #1f2937)"
                      : "radial-gradient(circle, #2dd4bf, #14b8a6)",
                  boxShadow:
                    recordingState === "recording"
                      ? "0 0 0 8px rgba(239,68,68,0.15), 0 0 0 16px rgba(239,68,68,0.07)"
                      : recordingState === "speaking"
                      ? "0 0 0 8px rgba(245,158,11,0.15), 0 0 0 16px rgba(245,158,11,0.07)"
                      : "0 0 0 4px rgba(45,212,191,0.15)",
                  transform: recordingState === "recording" ? "scale(1.08)" : "scale(1)",
                }}
              >
                {recordingState === "transcribing" || recordingState === "thinking" ? (
                  <Loader2 size={28} color="#8b949e" style={{ animation: "spin 1s linear infinite" }} />
                ) : recordingState === "speaking" ? (
                  <VolumeX size={28} color="#0d1117" />
                ) : recordingState === "recording" ? (
                  <MicOff size={28} color="#fff" />
                ) : (
                  <Mic size={28} color="#0d1117" />
                )}
              </button>

              <p style={{ fontSize: "0.75rem", color: "#6e7681", textAlign: "center" }}>
                {recordingState === "idle" && "Hold to speak · Release to send"}
                {recordingState === "speaking" && "Click mic to interrupt"}
                {(recordingState === "transcribing" || recordingState === "thinking") && "Please wait..."}
                {recordingState === "recording" && "Release when done speaking"}
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT — Code editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Editor header */}
          <div
            style={{
              padding: "0.5rem 1rem",
              borderBottom: "1px solid #30363d",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flexShrink: 0,
              backgroundColor: "#161b22",
            }}
          >
            <Terminal size={14} color="#8b949e" />
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#8b949e" }}>
              Code Editor
            </span>

            {currentPhase === 3 && (
              <>
                <div style={{ width: "1px", height: "16px", backgroundColor: "#30363d" }} />
                <select
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    setCurrentCode(STARTER_CODE[e.target.value] ?? "");
                  }}
                  style={{
                    backgroundColor: "#0d1117",
                    border: "1px solid #30363d",
                    borderRadius: "0.375rem",
                    color: "#e6edf3",
                    fontSize: "0.8rem",
                    padding: "0.25rem 0.5rem",
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {LANGUAGE_OPTIONS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </>
            )}

            <div style={{ flex: 1 }} />

            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: currentPhase === 3 ? "#2dd4bf" : "#8b949e",
                padding: "0.2rem 0.625rem",
                borderRadius: "999px",
                backgroundColor: currentPhase === 3 ? "rgba(45,212,191,0.1)" : "rgba(139,148,158,0.08)",
                border: `1px solid ${currentPhase === 3 ? "rgba(45,212,191,0.25)" : "#30363d"}`,
              }}
            >
              {currentPhase === 3 ? "● Active" : "Locked until Phase 3"}
            </span>
          </div>

          {/* Editor body */}
          {currentPhase === 3 ? (
            <div style={{ flex: 1, overflow: "hidden" }}>
              <MonacoEditor
                height="100%"
                language={language}
                value={currentCode || STARTER_CODE[language]}
                onChange={(val) => setCurrentCode(val ?? "")}
                theme="vs-dark"
                options={{
                  fontSize: 14,
                  fontFamily:
                    "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: "on",
                  renderLineHighlight: "line",
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: "on",
                  padding: { top: 16, bottom: 16 },
                  smoothScrolling: true,
                  cursorBlinking: "smooth",
                }}
              />
            </div>
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#0d1117",
              }}
            >
              <div
                style={{
                  padding: "2rem 2.5rem",
                  borderRadius: "1rem",
                  backgroundColor: "#161b22",
                  border: "1px solid #30363d",
                  textAlign: "center",
                  maxWidth: "400px",
                }}
              >
                <Code2
                  size={36}
                  color="#30363d"
                  style={{ marginBottom: "1rem" }}
                />
                <p
                  style={{
                    fontFamily: "Sora, sans-serif",
                    fontWeight: 700,
                    color: "#8b949e",
                    fontSize: "1rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  Waiting for Phase 3
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "#6e7681",
                    lineHeight: 1.6,
                    marginBottom: "1.25rem",
                  }}
                >
                  The live coding environment activates at the 20-minute mark when the DSA round begins.
                </p>
                <div
                  style={{
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    backgroundColor: pc.bg,
                    border: `1px solid ${pc.border}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      color: pc.color,
                      fontWeight: 600,
                    }}
                  >
                    Currently in {pc.label}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}