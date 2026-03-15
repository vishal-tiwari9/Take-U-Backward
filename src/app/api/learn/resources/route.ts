// PATH: src/app/api/learn/resources/route.ts  — CREATE new file + folders
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getGroq } from "@/lib/groq";

const SYSTEM = `You are an elite senior engineer and technical educator acting as a strict learning librarian.
Your job: curate the TOP 4-5 most valuable resources for a given skill topic. Quality over quantity, always.

HARD RULES:
1. Return ONLY a raw JSON array — no markdown, no backticks, no text before or after.
2. Prioritise: official documentation, high-star GitHub repos (>1000 stars), known educators
   (Fireship, ThePrimeagen, Traversy, Andrej Karpathy, CS50, MIT OpenCourseWare).
3. NEVER include: Medium posts, random YouTube channels, outdated tutorials (>3 years unless canonical),
   SEO-spam, paywalled content that isn't worth it.
4. Each "why" must be specific — not generic praise.
5. Assume today is mid-2025 — flag if a resource may be outdated.

JSON schema (return this exact shape, nothing else):
[
  {
    "title": "Exact resource name",
    "type": "docs | video | repo | course | article",
    "url": "real working URL",
    "author": "author or org name",
    "quality": "one sentence: why this source is credible",
    "why": "one sentence: what specifically makes this the best for THIS topic"
  }
]`;

export async function POST(req: NextRequest) {
  try {
    const { topic, description, tier } = await req.json();
    if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 });

    const completion = await getGroq().chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      temperature: 0.25,
      max_tokens:  900,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content:
          `Topic: "${topic}"
Level: ${tier ?? "Intermediate"}
Context: ${description ?? topic}

Curate the top 4–5 elite resources. Return only the JSON array.` },
      ],
    });

    const raw   = completion.choices[0]?.message?.content?.trim() ?? "[]";
    const match = raw.match(/\[[\s\S]*\]/);
    let resources = [];
    try { resources = JSON.parse(match ? match[0] : "[]"); } catch { resources = []; }

    return NextResponse.json({ resources });
  } catch (err) {
    console.error("learn/resources error:", err);
    return NextResponse.json({ error: "Failed to fetch resources." }, { status: 500 });
  }
}