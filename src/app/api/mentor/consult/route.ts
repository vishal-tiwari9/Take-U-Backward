// PATH: src/app/api/mentor/consult/route.ts  — CREATE
// Central mentor AI endpoint. Switches between 4 modes based on `topic`.
// Saves every session to MentorSession via Prisma for persistence.
export const dynamic = "force-dynamic";

import { NextResponse }   from "next/server";
import { auth } from "@/lib/auth";
import { prisma }         from "@/lib/prisma";
import { getGroq }        from "@/lib/groq";

// ─── Market signals injected into every prompt ───────────────────────
// In production these would be fetched from a live data source
// (LinkedIn Talent Insights, StackOverflow survey, TIOBE, etc.)
const MARKET_SIGNALS = {
  hotSkills:    ["AI Agents", "LangChain", "Rust", "WebAssembly", "Edge Computing", "RAG Systems"],
  decliningSkills: ["jQuery", "PHP (solo)", "Cordova", "REST-only backends"],
  growthSectors:["AI/ML Infra (+47% YoY)", "Cybersecurity (+32%)", "Cloud-Native (+28%)", "Web3 Tooling (+19%)"],
  salaryTrends: { "AI/ML":  "$165k avg", "DevOps": "$148k avg", "Web Dev": "$128k avg", "Blockchain": "$142k avg" },
  remoteRoles:  "73% of senior roles are now remote-first",
  updatedAt:    new Date().toISOString().slice(0, 10),
};

// ─── System prompts per mode ─────────────────────────────────────────
function buildSystemPrompt(topic: string, signals: typeof MARKET_SIGNALS): string {
  const base = `You are an elite career mentor named "ARIA" (Adaptive Reasoning Intelligence Advisor) for TalentOS — a premium placement-acceleration platform.
Your tone: direct, insightful, and motivating — like a senior engineer who genuinely cares.
Current market context (${signals.updatedAt}):
• Hot skills: ${signals.hotSkills.join(", ")}
• Declining: ${signals.decliningSkills.join(", ")}
• Growth sectors: ${signals.growthSectors.join(" | ")}
• Salary benchmarks: ${JSON.stringify(signals.salaryTrends)}
• ${signals.remoteRoles}

Always ground your advice in these signals. Never be generic. Be specific, actionable, and data-aware.`;

  const modes: Record<string, string> = {
    LearningPath: `${base}

MODE: Domain Deep-Dive (Learning Path Architect)
When the user names a domain, generate a STRUCTURED learning path as JSON with this exact shape:
{
  "title": "...",
  "totalWeeks": N,
  "marketInsight": "one sentence on why this domain is hot right now",
  "phases": [
    {
      "phase": 1,
      "title": "...",
      "weeks": "W1-W3",
      "skills": ["skill1", "skill2"],
      "resources": [{"name":"...", "type":"course|book|project", "url":"..."}],
      "milestone": "what the student will build/ship",
      "marketSignal": "why this specific skill is in demand"
    }
  ],
  "pivotSuggestion": "one bold adjacent skill to add given market signals",
  "salaryProjection": "realistic range after completing this path"
}
Return ONLY the JSON. No markdown fences. No preamble.`,

    Placement: `${base}

MODE: Placement War-Room (Interview & Strategy HQ)
You provide company-specific placement intelligence. When user mentions a company or role, return JSON:
{
  "company": "...",
  "role": "...",
  "strategy": "2-3 sentence company-specific approach",
  "interviewRounds": [
    {"round": "...", "format": "...", "tips": ["..."]}
  ],
  "mockQuestions": [
    {"type": "DSA|Behavioral|System Design|HR", "question": "...", "answerFramework": "..."}
  ],
  "resumeTips": ["specific tip with reasoning"],
  "insiderSignal": "what this company values most right now based on market data",
  "redFlags": ["common mistake candidates make at this company"]
}
Return ONLY the JSON. No markdown fences. No preamble.`,

    TimeMgmt: `${base}

MODE: Time Architect (Schedule Optimizer)
Analyze the student's current schedule and constraints. Return JSON:
{
  "diagnosis": "honest 1-sentence assessment of current schedule",
  "productivityScore": N, // 0-100
  "weeklyPlan": [
    {
      "day": "Monday",
      "blocks": [
        {"time": "6-7am", "activity": "...", "type": "deepWork|admin|learning|exercise|rest", "reason": "..."}
      ]
    }
  ],
  "topBottlenecks": ["..."],
  "quickWins": ["change you can make TODAY"],
  "focusFormula": "your recommended deep-work strategy (Pomodoro / time-blocking / etc.)",
  "warningSign": "what will happen if they don't change X"
}
Return ONLY the JSON. No markdown fences. No preamble.`,

    FuturePredict: `${base}

MODE: Future Predictor (Career Path Analysis)
Analyze the user's interests against market vectors. Return JSON:
{
  "chosenPath": "...",
  "futureProofScore": N, // 0-100
  "verdict": "Strong | Stable | At Risk | Pivot Needed",
  "reasoning": "2-3 sentences grounded in market data",
  "5yearProjection": "what this role looks like in 2030",
  "threatVectors": ["AI automation risk", "market saturation", etc.],
  "opportunityVectors": ["adjacent upside", "niche demand"],
  "pivots": [
    {
      "path": "...",
      "effort": "3 months | 6 months | 1 year",
      "salaryDelta": "+$Xk",
      "reasoning": "...",
      "firstStep": "exactly what to do this week"
    }
  ],
  "boldPrediction": "one contrarian insight about this career path"
}
Return ONLY the JSON. No markdown fences. No preamble.`,
  };

  return modes[topic] ?? base;
}

// ─── POST /api/mentor/consult ─────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await auth(); 
    const userId = session?.user?.id ?? "anonymous";

    const body = await req.json() as {
      topic:     "LearningPath" | "Placement" | "TimeMgmt" | "FuturePredict";
      message:   string;
      sessionId?: string;        // if continuing an existing session
      messages?: { role: string; content: string }[];
    };

    const { topic, message, sessionId, messages = [] } = body;

    if (!topic || !message) {
      return NextResponse.json({ error: "topic and message are required" }, { status: 400 });
    }

    // Fetch previous messages if sessionId provided
    let priorMessages: { role: string; content: string }[] = messages;
    let existingSession = null;

    if (sessionId) {
      try {
        existingSession = await prisma.mentorSession.findUnique({ where: { id: sessionId } });
        if (existingSession) {
          priorMessages = existingSession.messages as { role: string; content: string }[];
        }
      } catch { /* session not found, start fresh */ }
    }

    const systemPrompt = buildSystemPrompt(topic, MARKET_SIGNALS);

    // Build Groq message chain
    const groqMessages = [
      ...priorMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content: message },
    ];

    const completion = await getGroq().chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      temperature: 0.55,
      max_tokens:  2048,
      messages: [
        { role: "system", content: systemPrompt },
        ...groqMessages,
      ],
    });

    const rawContent = completion.choices[0]?.message?.content?.trim() ?? "{}";

    // Try to parse structured JSON; fall back to plain text
    let parsedContent: unknown = rawContent;
    let isStructured = false;
    try {
      parsedContent  = JSON.parse(rawContent);
      isStructured   = true;
    } catch { /* keep as string */ }

    // Build updated message history
    const updatedMessages = [
      ...priorMessages,
      { role: "user",      content: message    },
      { role: "assistant", content: rawContent  },
    ];

    // Generate a title from the first user message
    const title = existingSession?.title
      ?? message.slice(0, 72) + (message.length > 72 ? "…" : "");

    // Persist to Prisma
    let savedSession: { id: string } | null = null;
    try {
      if (existingSession) {
        savedSession = await prisma.mentorSession.update({
          where:  { id: existingSession.id },
          data:   { content: parsedContent as any, messages: updatedMessages, updatedAt: new Date() },
          select: { id: true },
        });
      } else if (userId !== "anonymous") {
        savedSession = await prisma.mentorSession.create({
          data: {
            userId,
            topic,
            title,
            content:       parsedContent as any,
            messages:      updatedMessages,
            marketSignals: MARKET_SIGNALS,
          },
          select: { id: true },
        });
      }
    } catch (dbErr) {
      console.error("[Mentor] Prisma save failed:", dbErr);
      // Non-fatal — return the AI response even if DB write fails
    }

    return NextResponse.json({
      sessionId:    savedSession?.id ?? sessionId ?? null,
      topic,
      isStructured,
      content:      parsedContent,
      raw:          rawContent,
      marketSignals: MARKET_SIGNALS,
    });

  } catch (err) {
    console.error("[Mentor] consult error:", err);
    return NextResponse.json({ error: "Mentor consultation failed" }, { status: 500 });
  }
}