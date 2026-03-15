// PATH: src/app/api/mentor/voice/webhook/route.ts  — CREATE
// Vapi sends POST events here during and after every call.
// Events we handle:
//   call-ended        → extract summary + action items → save to Prisma
//   transcript        → stream partial transcript (ignored for now, logged)
//   status-update     → call lifecycle events (ringing, in-progress, ended)
//
// Configure in Vapi dashboard: Server URL = https://yourdomain.com/api/mentor/voice/webhook
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma }       from "@/lib/prisma";
import { getGroq }      from "@/lib/groq";

// ─── Vapi webhook event shape (partial) ─────────────────────────────
interface VapiMessage {
  type:    string;          // "call-ended" | "transcript" | "status-update" | "hang"
  call?: {
    id:        string;
    status:    string;
    metadata?: {
      userId?:    string;
      pillarId?:  string;
      sessionId?: string;
      startedAt?: string;
    };
    transcript?:      string;   // full transcript on call-ended
    recordingUrl?:    string;
    endedReason?:     string;   // "customer-ended-call" | "silence-timed-out" etc.
    startedAt?:       string;
    endedAt?:         string;
    costBreakdown?:   Record<string, number>;
    durationSeconds?: number;
  };
  transcript?: string;          // partial transcript event
}

// ─── POST /api/mentor/voice/webhook ──────────────────────────────────
export async function POST(req: Request) {
  try {
    // Verify Vapi webhook secret (set VAPI_WEBHOOK_SECRET in .env)
    const secret    = req.headers.get("x-vapi-secret");
    const envSecret = process.env.VAPI_WEBHOOK_SECRET;
    if (envSecret && secret !== envSecret) {
      console.warn("[Voice Webhook] Invalid secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: VapiMessage = await req.json();
    const { type, call } = body;

    // ── Status update — log and acknowledge ───────────────────────
    if (type === "status-update") {
      console.log(`[Voice] Call ${call?.id} status → ${call?.status}`);
      return NextResponse.json({ received: true });
    }

    // ── Transcript event — partial, just acknowledge ───────────────
    if (type === "transcript") {
      return NextResponse.json({ received: true });
    }

    // ── Call ended — the main event ───────────────────────────────
    if (type === "call-ended" && call) {
      await handleCallEnded(call);
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error("[Voice Webhook] error:", err);
    // Always return 200 to Vapi — otherwise it will retry
    return NextResponse.json({ received: true, error: "Internal processing error" });
  }
}

// ─── Handle call-ended ────────────────────────────────────────────────
async function handleCallEnded(call: NonNullable<VapiMessage["call"]>) {
  const transcript  = call.transcript ?? "";
  const metadata    = call.metadata ?? {};
  const { userId, pillarId, sessionId } = metadata;

  if (!transcript || transcript.length < 50) {
    console.log("[Voice Webhook] Transcript too short, skipping extraction");
    return;
  }

  // ── Extract summary + action items via Groq ───────────────────
  let summary     = "";
  let actionItems: string[] = [];
  let keyInsights: string[] = [];

  try {
    const extractionPrompt = `You are analyzing a career mentoring phone call transcript.
Extract ONLY the following as a JSON object (no markdown, no preamble):
{
  "summary": "2-3 sentence plain-English summary of what was discussed",
  "actionItems": ["specific thing student should do", "another action"],
  "keyInsights": ["insight ARIA gave", "another insight"],
  "mood": "engaged | confused | motivated | stressed | neutral",
  "nextTopicSuggestion": "one thing to discuss next session"
}

Transcript:
${transcript.slice(0, 8000)}`; // truncate for token safety

    const completion = await getGroq().chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens:  512,
      messages: [{ role: "user", content: extractionPrompt }],
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "{}";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

    summary     = parsed.summary     ?? "";
    actionItems = parsed.actionItems ?? [];
    keyInsights = parsed.keyInsights ?? [];

  } catch (err) {
    console.error("[Voice Webhook] Extraction failed:", err);
    summary = "Voice call completed. Transcript available below.";
  }

  // ── Build structured content to save ─────────────────────────
  const callContent = {
    type:          "voice_call",
    status:        "completed",
    vapiCallId:    call.id,
    pillarId,
    durationSeconds: call.durationSeconds ?? 0,
    endedReason:   call.endedReason ?? "unknown",
    recordingUrl:  call.recordingUrl ?? null,
    summary,
    actionItems,
    keyInsights,
    transcript,
    callDate:      call.endedAt ?? new Date().toISOString(),
  };

  // ── Upsert MentorSession ──────────────────────────────────────
  if (!userId || userId === "anonymous") {
    console.log("[Voice Webhook] No userId in metadata, skipping DB save");
    return;
  }

  try {
    if (sessionId) {
      // Update the pending session created at call start
      await prisma.mentorSession.update({
        where: { id: sessionId },
        data: {
          content:  callContent,
          title:    `📞 ${summary.slice(0, 72)}${summary.length > 72 ? "…" : ""}`,
          messages: [
            { role: "system",    content: `[Voice call — ${call.durationSeconds ?? 0}s]` },
            { role: "assistant", content: summary },
            ...actionItems.map(a => ({ role: "assistant" as const, content: `✅ ${a}` })),
          ],
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.mentorSession.create({
        data: {
          userId,
          topic:   pillarId ?? "LearningPath",
          title:   `📞 ${summary.slice(0, 72)}${summary.length > 72 ? "…" : ""}`,
          content: callContent,
          messages: [
            { role: "system",    content: `[Voice call — ${call.durationSeconds ?? 0}s]` },
            { role: "assistant", content: summary },
            ...actionItems.map(a => ({ role: "assistant" as const, content: `✅ ${a}` })),
          ],
          marketSignals: {},
        },
      });
    }

    console.log(`[Voice Webhook] Session saved for user ${userId}`);
  } catch (dbErr) {
    console.error("[Voice Webhook] DB save failed:", dbErr);
  }
}