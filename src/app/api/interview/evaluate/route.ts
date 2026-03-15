export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGroq } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { question, answer, expectedPoints, category, role } = await req.json();

    if (!question || !answer) {
      return NextResponse.json({ error: "Question and answer are required." }, { status: 400 });
    }

    if (answer.trim().length < 10) {
      return NextResponse.json({
        evaluation: {
          score: 0,
          verdict: "incomplete",
          feedback: "Answer is too short to evaluate.",
          strengths: [],
          improvements: ["Please provide a more detailed answer."],
          idealAnswer: "",
        },
      });
    }

    const systemPrompt = `You are an expert interviewer evaluating a candidate's answer.
Evaluate the answer and return ONLY a JSON object with this exact structure:
{
  "score": <number 0-100>,
  "verdict": "excellent"|"good"|"average"|"poor",
  "feedback": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"],
  "idealAnswer": "<brief description of what an ideal answer would cover, 2-3 sentences>"
}

Scoring guide:
- 85-100: Excellent — covered all key points with depth and clarity
- 65-84: Good — covered most key points with reasonable depth
- 40-64: Average — covered some points but missing important aspects
- 0-39: Poor — significant gaps or incorrect information

Return ONLY valid JSON. No markdown, no explanation.`;

    const userPrompt = `Role: ${role}
Category: ${category}
Question: ${question}
Expected Key Points: ${expectedPoints?.join(", ") || "General quality assessment"}
Candidate's Answer: ${answer}`;

    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 800,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let evaluation;
    try {
      evaluation = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Invalid JSON from Groq");
      evaluation = JSON.parse(match[0]);
    }

    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error("Interview evaluate error:", error);
    return NextResponse.json({ error: "Evaluation failed. Please try again." }, { status: 500 });
  }
}
