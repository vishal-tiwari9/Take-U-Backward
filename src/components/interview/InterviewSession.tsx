"use client";

import { useState, useEffect, useRef } from "react";
import {
  Loader2,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Clock,
  Lightbulb,
  Eye,
  EyeOff,
} from "lucide-react";

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

interface InterviewSessionProps {
  questions: Question[];
  config: { role: string; interviewType: string; difficulty: string };
  onComplete: (answers: AnsweredQuestion[]) => void;
}

const verdictConfig = {
  excellent: { color: "#2dd4bf", bg: "rgba(45,212,191,0.1)", border: "rgba(45,212,191,0.25)", label: "Excellent" },
  good:      { color: "#22c55e", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.25)",  label: "Good" },
  average:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", label: "Average" },
  poor:      { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.25)",  label: "Poor" },
};

export function InterviewSession({ questions, config, onComplete }: InterviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<AnsweredQuestion[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [showIdeal, setShowIdeal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [timerActive, setTimerActive] = useState(true);
  const [timeTaken, setTimeTaken] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const totalTime = 120;

  useEffect(() => {
    setTimeLeft(totalTime);
    setTimerActive(true);
    setTimeTaken(0);
    setShowHint(false);
    setShowIdeal(false);
    textareaRef.current?.focus();
  }, [currentIndex]);

  useEffect(() => {
    if (!timerActive) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
      setTimeTaken((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [timerActive, currentIndex]);

  async function handleSubmit() {
    if (!answer.trim() || evaluating) return;
    clearInterval(timerRef.current!);
    setTimerActive(false);
    setEvaluating(true);

    const res = await fetch("/api/interview/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: currentQuestion.question,
        answer,
        expectedPoints: currentQuestion.expectedPoints,
        category: currentQuestion.category,
        role: config.role,
      }),
    });

    const data = await res.json();
    setEvaluation(data.evaluation);
    setEvaluating(false);
  }

  function handleNext() {
    if (!evaluation) return;
    const answered: AnsweredQuestion = {
      question: currentQuestion,
      answer,
      evaluation,
      timeTaken,
    };
    const updated = [...answeredQuestions, answered];
    setAnsweredQuestions(updated);

    if (isLastQuestion) {
      onComplete(updated);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setAnswer("");
      setEvaluation(null);
    }
  }

  const timerPercent = (timeLeft / totalTime) * 100;
  const timerColor = timeLeft > 60 ? "#2dd4bf" : timeLeft > 30 ? "#f59e0b" : "#ef4444";
  const vc = evaluation ? (verdictConfig[evaluation.verdict] ?? verdictConfig.average) : null;

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Progress bar */}
      <div style={{ padding: "1rem 1.5rem", borderRadius: "0.875rem", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "1rem" }}>
        <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" }}>
          Q{currentIndex + 1} / {questions.length}
        </span>
        <div style={{ flex: 1, height: "6px", backgroundColor: "var(--bg-secondary)", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${((currentIndex + (evaluation ? 1 : 0)) / questions.length) * 100}%`, background: "linear-gradient(90deg, #2dd4bf, #14b8a6)", borderRadius: "3px", transition: "width 0.4s ease" }} />
        </div>
        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text-secondary)", fontFamily: "Sora, sans-serif", whiteSpace: "nowrap" }}>
          {answeredQuestions.length > 0 ? `Avg: ${Math.round(answeredQuestions.reduce((s, q) => s + q.evaluation.score, 0) / answeredQuestions.length)}` : config.interviewType}
        </span>
      </div>

      {/* Question card */}
      <div style={{ padding: "1.75rem", borderRadius: "1rem", backgroundColor: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
          <span style={{ padding: "0.25rem 0.75rem", borderRadius: "999px", backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", color: "#fbbf24", fontSize: "0.75rem", fontWeight: 700 }}>
            {currentQuestion.category}
          </span>

          {/* Timer */}
          {!evaluation && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={14} color={timerColor} />
              <span style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "0.9rem", color: timerColor }}>
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
              </span>
              <div style={{ width: "48px", height: "4px", backgroundColor: "var(--bg-secondary)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${timerPercent}%`, backgroundColor: timerColor, borderRadius: "2px", transition: "width 1s linear, background-color 0.3s" }} />
              </div>
            </div>
          )}
        </div>

        <p style={{ fontFamily: "Sora, sans-serif", fontWeight: 700, fontSize: "1.125rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
          {currentQuestion.question}
        </p>

        {/* Hint toggle */}
        {!evaluation && (
          <button
            onClick={() => setShowHint(!showHint)}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "none", color: "var(--text-muted)", fontSize: "0.8rem", cursor: "pointer", marginBottom: showHint ? "0.75rem" : "0" }}
          >
            <Lightbulb size={13} />
            {showHint ? "Hide hint" : "Show hint"}
          </button>
        )}
        {showHint && !evaluation && (
          <div style={{ padding: "0.75rem 1rem", borderRadius: "0.5rem", backgroundColor: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", color: "#fbbf24", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
            💡 {currentQuestion.hint}
          </div>
        )}

        {/* Answer area */}
        {!evaluation ? (
          <>
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here... Be specific and use examples where applicable."
              rows={6}
              style={{
                width: "100%",
                padding: "0.875rem 1rem",
                backgroundColor: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                color: "var(--text-primary)",
                fontSize: "0.9375rem",
                outline: "none",
                resize: "vertical",
                fontFamily: "DM Sans, sans-serif",
                lineHeight: 1.7,
                marginBottom: "0.875rem",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {answer.split(" ").filter(Boolean).length} words
              </span>
              <button
                onClick={handleSubmit}
                disabled={!answer.trim() || evaluating}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.75rem",
                  border: "none",
                  cursor: !answer.trim() || evaluating ? "not-allowed" : "pointer",
                  opacity: !answer.trim() || evaluating ? 0.6 : 1,
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "#0d1117",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  fontFamily: "Sora, sans-serif",
                }}
              >
                {evaluating ? (
                  <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Evaluating...</>
                ) : (
                  <><Send size={16} /> Submit Answer</>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Evaluation result */
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* Your answer */}
            <div style={{ padding: "1rem", borderRadius: "0.75rem", backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>Your Answer</p>
              <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{answer}</p>
            </div>

            {/* Score banner */}
            <div style={{ padding: "1.25rem", borderRadius: "0.75rem", backgroundColor: vc!.bg, border: `1px solid ${vc!.border}`, display: "flex", alignItems: "center", gap: "1.25rem" }}>
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontFamily: "Sora, sans-serif", fontWeight: 800, fontSize: "2rem", color: vc!.color, lineHeight: 1 }}>{evaluation!.score}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>/100</div>
              </div>
              <div>
                <span style={{ display: "inline-block", padding: "0.2rem 0.625rem", borderRadius: "999px", backgroundColor: `${vc!.color}20`, color: vc!.color, fontSize: "0.75rem", fontWeight: 700, marginBottom: "0.375rem" }}>
                  {vc!.label}
                </span>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>{evaluation!.feedback}</p>
              </div>
            </div>

            {/* Strengths */}
            {evaluation!.strengths.length > 0 && (
              <div>
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#2dd4bf", marginBottom: "0.5rem" }}>✓ Strengths</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {evaluation!.strengths.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                      <CheckCircle2 size={14} color="#2dd4bf" style={{ marginTop: "2px", flexShrink: 0 }} />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvements */}
            {evaluation!.improvements.length > 0 && (
              <div>
                <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#f87171", marginBottom: "0.5rem" }}>✗ Areas to improve</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                  {evaluation!.improvements.map((imp, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                      <XCircle size={14} color="#f87171" style={{ marginTop: "2px", flexShrink: 0 }} />
                      {imp}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ideal answer toggle */}
            <button
              onClick={() => setShowIdeal(!showIdeal)}
              style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 0.875rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "none", color: "var(--text-muted)", fontSize: "0.8125rem", cursor: "pointer", alignSelf: "flex-start" }}
            >
              {showIdeal ? <EyeOff size={14} /> : <Eye size={14} />}
              {showIdeal ? "Hide ideal answer" : "Show ideal answer"}
            </button>

            {showIdeal && (
              <div style={{ padding: "0.875rem 1rem", borderRadius: "0.5rem", backgroundColor: "rgba(45,212,191,0.05)", border: "1px solid rgba(45,212,191,0.2)", fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                <AlertCircle size={14} color="var(--teal)" style={{ display: "inline", marginRight: "0.375rem", verticalAlign: "text-bottom" }} />
                {evaluation!.idealAnswer}
              </div>
            )}

            {/* Next button */}
            <button
              onClick={handleNext}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.875rem",
                borderRadius: "0.75rem",
                border: "none",
                cursor: "pointer",
                background: "linear-gradient(135deg, #2dd4bf, #14b8a6)",
                color: "#0d1117",
                fontSize: "0.9375rem",
                fontWeight: 700,
                fontFamily: "Sora, sans-serif",
              }}
            >
              {isLastQuestion ? "View Final Report" : "Next Question"}
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}