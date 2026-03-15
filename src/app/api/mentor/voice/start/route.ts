// PATH: src/app/api/mentor/voice/start/route.ts  — CREATE
// Triggers an outbound Vapi.ai phone call to the student.
// Injects full ARIA context (pillar prompt + user history + market signals)
// as Vapi assistantOverrides so the call starts hot — zero warm-up delay.
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ─── Market signals (mirrors /api/mentor/consult) ────────────────────
const MARKET_SIGNALS = {
  hotSkills:    ["AI Agents", "LangChain", "Rust", "WebAssembly", "RAG Systems", "Edge Computing"],
  growthSectors:["AI/ML Infra +47%", "Cybersecurity +32%", "Cloud-Native +28%"],
  salaryTrends: { "AI/ML": "$165k", "DevOps": "$148k", "Web Dev": "$128k" },
  updatedAt:    new Date().toISOString().slice(0, 10),
};

// ─── Voice-optimised system prompts per pillar ──────────────────────
// Key difference from JSON prompts: natural spoken language, no JSON output,
// conversational flow, uses filler affirmations, avoids jargon dumps.
function buildVoicePrompt(
  pillarId:    string,
  userName:    string,
  recentTopics:string,
  signals:     typeof MARKET_SIGNALS
): string {
  const base = `You are ARIA — a warm, sharp, senior software engineer mentoring ${userName || "a student"} on their career.
You are on a PHONE CALL. Speak naturally. Use short sentences. Pause for the student to respond.
Never read lists aloud. Summarise them conversationally instead.
Never give legal, medical, financial investment advice. Redirect firmly but kindly.
Stay strictly focused on: learning paths, placement prep, time management, and career pathfinding.
Market context (${signals.updatedAt}): Hot skills: ${signals.hotSkills.slice(0,4).join(", ")}.
${recentTopics ? `The student has recently been working on: ${recentTopics}.` : ""}
Start by warmly greeting ${userName || "the student"} and asking what they'd like to focus on today.`;

  const modes: Record<string, string> = {
    LearningPath: `${base}
Your role today: Learning Path Architect.
Help the student map a skill-acquisition roadmap for their chosen domain.
Ask about their current level, available hours per week, and target role.
Give specific resource recommendations (courses, projects, timelines) — verbally, not as a list dump.
Weave in market signals naturally. For example: "By the way, I'm seeing a big uptick in RAG systems — might be worth adding that."`,

    Placement: `${base}
Your role today: Placement War-Room strategist.
Help the student prepare for their specific target company and role.
Ask: which company, which role, how many weeks until the interview, their weakest area.
Coach them through mock questions conversationally — ask one question, listen, give targeted feedback.
Share insider signals: "Google has been really heavy on system design lately."`,

    TimeMgmt: `${base}
Your role today: Time Architect.
Help the student build an optimised weekly schedule.
Ask about: college hours, sleep, commute, energy peaks (morning person?), current pain points.
Suggest time-blocking, deep-work windows, and recovery time — frame it as a story, not a spreadsheet.
Be honest if their schedule is unrealistic. Say things like "That's a lot — let's be real about what can move."`,

    FuturePredict: `${base}
Your role today: Career Pathfinder.
Analyse the student's chosen career path against current industry vectors.
Ask about their interests, current skills, and 5-year vision.
Give a candid assessment — including risks — then suggest one or two pivots if needed.
Sound like a senior engineer who genuinely cares, not a consultant. Be direct, not diplomatic.`,
  };

  return modes[pillarId] ?? base;
}

// ─── POST /api/mentor/voice/start ───────────────────────────────────
export async function POST(req: Request) {
  try {
    const session = await auth(); 
    const userId = session?.user?.id ?? "anonymous";
    const userName = (session?.user as any)?.name ?? "";

    const body = await req.json() as {
      phoneNumber: string;       // E.164 format e.g. +919876543210
      pillarId:    string;       // LearningPath | Placement | TimeMgmt | FuturePredict
      sessionId?:  string;       // optional: link call to existing text session
    };

    const { phoneNumber, pillarId, sessionId } = body;

    if (!phoneNumber || !pillarId) {
      return NextResponse.json(
        { error: "phoneNumber and pillarId are required" },
        { status: 400 }
      );
    }

    // Basic E.164 validation
    if (!/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: "phoneNumber must be in E.164 format, e.g. +919876543210" },
        { status: 400 }
      );
    }

    // ── Fetch user context from Prisma ────────────────────────────
    let recentTopics = "";
    if (userId) {
      try {
        const recentSessions = await prisma.mentorSession.findMany({
          where:   { userId },
          orderBy: { updatedAt: "desc" },
          take:    4,
          select:  { topic: true, title: true },
        });
        recentTopics = recentSessions
          .map(s => `${s.topic}: ${s.title}`)
          .join("; ");
      } catch { /* non-fatal */ }
    }

    // ── Build Vapi payload ────────────────────────────────────────
    // Must use `assistant` (inline) — `assistantOverrides` only works
    // when paired with an existing `assistantId` stored in the dashboard.
    const systemPrompt = buildVoicePrompt(pillarId, userName, recentTopics, MARKET_SIGNALS);

    const vapiPayload = {
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      customer: {
        number: phoneNumber,
        name:   userName || "Student",
      },

      // Inline assistant — no Vapi dashboard assistant needed
      assistant: {
        name: "ARIA",

        // Voice — falls back to PlayHT if no ElevenLabs key set
        voice: process.env.ELEVENLABS_VOICE_ID
          ? {
              provider:        "11labs",
              voiceId:         process.env.ELEVENLABS_VOICE_ID,
              stability:       0.45,
              similarityBoost: 0.82,
              style:           0.18,
              useSpeakerBoost: true,
            }
          : {
              provider: "playht",
              voiceId:  "s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json",
            },

        // STT — Deepgram Nova-2
        transcriber: {
          provider:    "deepgram",
          model:       "nova-2",
          language:    "en",
          smartFormat: true,
        },

        // LLM — Groq if key available, else openai gpt-4o-mini
        model: process.env.GROQ_API_KEY
          ? {
              provider:    "groq",
              model:       "llama-3.3-70b-versatile",
              temperature: 0.55,
              maxTokens:   400,
              messages:    [{ role: "system", content: systemPrompt }],
            }
          : {
              provider:    "openai",
              model:       "gpt-4o-mini",
              temperature: 0.55,
              maxTokens:   400,
              messages:    [{ role: "system", content: systemPrompt }],
            },

        firstMessage:          `Hi${userName ? ` ${userName.split(" ")[0]}` : ""}! This is ARIA from TalentOS. I'm calling to help with your ${PILLAR_LABELS[pillarId] ?? "career"}. How are you doing today?`,
        endCallMessage:        "It was great talking with you. I'll send a full summary to your TalentOS dashboard. Good luck — you've got this!",
        silenceTimeoutSeconds: 12,
        maxDurationSeconds:    1800,
        backgroundSound:       "off",
        backchannelingEnabled: true,
        backgroundDenoisingEnabled: true,

        serverUrl:       process.env.VAPI_WEBHOOK_URL
                           ?? `${process.env.NEXTAUTH_URL}/api/mentor/voice/webhook`,
        serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET,
      },

      metadata: {
        userId:    userId ?? "anonymous",
        pillarId,
        sessionId: sessionId ?? null,
        startedAt: new Date().toISOString(),
      },
    };

    // Debug: log exactly what we're sending (remove in production)
    console.log("[Voice] Sending to Vapi:", JSON.stringify({
      phoneNumberId: vapiPayload.phoneNumberId,
      customer:      vapiPayload.customer,
      assistantKeys: Object.keys(vapiPayload.assistant),
      modelProvider: (vapiPayload.assistant.model as any).provider,
      voiceProvider: (vapiPayload.assistant.voice as any).provider,
    }, null, 2));

    // ── Call Vapi API ─────────────────────────────────────────────
    const vapiKey = process.env.VAPI_API_KEY;
    if (!vapiKey) {
      return NextResponse.json({ error: "VAPI_API_KEY not configured" }, { status: 500 });
    }

    const vapiRes = await fetch("https://api.vapi.ai/call/phone", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${vapiKey}`,
      },
      body: JSON.stringify(vapiPayload),
    });

    if (!vapiRes.ok) {
      const errText = await vapiRes.text();
      console.error("[Voice] Vapi error:", errText);
      return NextResponse.json(
        { error: "Failed to initiate call", detail: errText },
        { status: vapiRes.status }
      );
    }

    const vapiData = await vapiRes.json();

    // ── Create a pending MentorSession for this call ──────────────
    let callSessionId: string | null = sessionId ?? null;
    if (userId && !sessionId) {
      try {
        const created = await prisma.mentorSession.create({
          data: {
            userId,
            topic:   pillarId,
            title:   `📞 Voice Call — ${PILLAR_LABELS[pillarId] ?? pillarId}`,
            content: { status: "call_initiated", vapiCallId: vapiData.id },
            messages: [],
            marketSignals: MARKET_SIGNALS,
          },
          select: { id: true },
        });
        callSessionId = created.id;
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({
      success:       true,
      callId:        vapiData.id,
      status:        vapiData.status,
      sessionId:     callSessionId,
      estimatedRingMs: 3500,
    });

  } catch (err) {
    console.error("[Voice] start error:", err);
    return NextResponse.json({ error: "Voice call initiation failed" }, { status: 500 });
  }
}

// ─── Pillar human-readable labels ────────────────────────────────────
const PILLAR_LABELS: Record<string, string> = {
  LearningPath:  "Domain Deep-Dive",
  Placement:     "Placement War-Room",
  TimeMgmt:      "Time Architecture",
  FuturePredict: "Future Prediction",
};