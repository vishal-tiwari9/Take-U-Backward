"use client";

import { useState } from "react";
import { Mic, Code2, ChevronRight, Zap } from "lucide-react";
import { InterviewSetup } from "@/components/interview/InterviewSetup";
import { InterviewSession } from "@/components/interview/InterviewSession";
import { InterviewReport } from "@/components/interview/InterviewReport";
import { useRouter } from "next/navigation";

interface Question {
  id: number;
  question: string;
  category: string;
  hint: string;
  expectedPoints: string[];
}

interface Evaluation {
  score: number;
  verdict: "excellent" | "good" | "average" | "poor";
  feedback: string;
  strengths: string[];
  improvements: string[];
  idealAnswer: string;
}

interface AnsweredQuestion {
  question: Question;
  answer: string;
  evaluation: Evaluation;
  timeTaken: number;
}

interface Config {
  role: string;
  interviewType: string;
  difficulty: string;
  techStack: string;
  yearsOfExperience: string;
}

type Stage = "home" | "setup" | "session" | "report";

export default function MockInterviewPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("home");
  const [config, setConfig] = useState<Config | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnsweredQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStart(cfg: Config) {
    setLoading(true);
    setError("");

    const res = await fetch("/api/interview/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to generate questions.");
      setLoading(false);
      return;
    }

    setConfig(cfg);
    setQuestions(data.questions);
    setStage("session");
    setLoading(false);
  }

  async function handleComplete(completedAnswers: AnsweredQuestion[]) {
    setAnswers(completedAnswers);
    setStage("report");

    if (config) {
      const avgScore = Math.round(
        completedAnswers.reduce((s, a) => s + a.evaluation.score, 0) / completedAnswers.length
      );
      await fetch("/api/interview/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: config.role,
          interviewType: config.interviewType,
          difficulty: config.difficulty,
          result: { avgScore, answers: completedAnswers },
        }),
      });
    }
  }

  function handleRestart() {
    setStage("home");
    setConfig(null);
    setQuestions([]);
    setAnswers([]);
    setError("");
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Mic size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontFamily: "Sora, sans-serif", fontSize: "1.625rem", fontWeight: 800 }}>
              Mock Interview
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              {stage === "home" && "Choose your interview mode"}
              {stage === "setup" && "Configure your interview session"}
              {stage === "session" && config && `${config.role} · ${config.interviewType} · ${config.difficulty} Level`}
              {stage === "report" && "Interview complete — here's your performance report"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: "0.875rem 1.25rem", borderRadius: "0.75rem", backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
          {error}
        </div>
      )}

      {/* Home — mode picker */}
      {stage === "home" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", maxWidth: "800px" }}>
          {/* Quick interview card */}
          <button
            onClick={() => setStage("setup")}
            style={{
              padding: "2rem",
              borderRadius: "1rem",
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              textAlign: "left",
              transition: "border-color 0.2s, box-shadow 0.2s",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #2dd4bf, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Mic size={24} color="#0d1117" />
            </div>
            <div>
              <p style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1.0625rem", marginBottom: "0.375rem" }}>
                Quick Interview
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                5 AI-generated questions with instant scoring. Choose type, difficulty, and role. ~10 minutes.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "var(--teal)", fontSize: "0.875rem", fontWeight: 600 }}>
              Start <ChevronRight size={16} />
            </div>
          </button>

          {/* FAANG simulator card */}
          <button
            onClick={() => router.push("/interview")}
            style={{
              padding: "2rem",
              borderRadius: "1rem",
              backgroundColor: "var(--bg-card)",
              border: "1px solid rgba(245,158,11,0.3)",
              background: "linear-gradient(135deg, rgba(245,158,11,0.04), rgba(217,119,6,0.04))",
              cursor: "pointer",
              textAlign: "left",
              transition: "border-color 0.2s, box-shadow 0.2s",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: "1rem", right: "1rem", padding: "0.2rem 0.625rem", borderRadius: "999px", backgroundColor: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontSize: "0.7rem", fontWeight: 700 }}>
              NEW
            </div>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Code2 size={24} color="#0d1117" />
            </div>
            <div>
              <p style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1.0625rem", marginBottom: "0.375rem" }}>
                FAANG Interview Simulator
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                Full 45-minute structured interview. 3 phases, live Monaco code editor, speech I/O, and real-time AI evaluation.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", color: "#f59e0b", fontSize: "0.875rem", fontWeight: 600 }}>
              <Zap size={15} /> Launch Full Screen <ChevronRight size={16} />
            </div>
          </button>
        </div>
      )}

      {stage === "setup" && (
        <InterviewSetup onStart={handleStart} loading={loading} />
      )}

      {stage === "session" && config && (
        <InterviewSession questions={questions} config={config} onComplete={handleComplete} />
      )}

      {stage === "report" && config && (
        <InterviewReport answers={answers} config={config} onRestart={handleRestart} />
      )}
    </div>
  );
}
