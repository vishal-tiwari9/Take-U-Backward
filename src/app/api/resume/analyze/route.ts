export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGroq } from "@/lib/groq";
import { prisma } from "@/lib/prisma";
import { extractText } from "unpdf";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("resume") as File | null;
    const jobDescription = formData.get("jobDescription") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be under 5MB" }, { status: 400 });
    }

    // Extract text — unpdf works natively with ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const { text: resumeText } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true });

    if (!resumeText || resumeText.length < 100) {
      return NextResponse.json(
        { error: "Could not extract enough text from the PDF. Make sure it's not a scanned image." },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) resume analyzer. 
Analyze the provided resume and return a JSON object with the following structure:
{
  "atsScore": <number 0-100>,
  "overallFeedback": "<2-3 sentence summary>",
  "sections": {
    "contactInfo": { "score": <0-100>, "status": "good"|"warning"|"missing", "feedback": "<string>" },
    "summary": { "score": <0-100>, "status": "good"|"warning"|"missing", "feedback": "<string>" },
    "experience": { "score": <0-100>, "status": "good"|"warning"|"missing", "feedback": "<string>" },
    "education": { "score": <0-100>, "status": "good"|"warning"|"missing", "feedback": "<string>" },
    "skills": { "score": <0-100>, "status": "good"|"warning"|"missing", "feedback": "<string>" },
    "formatting": { "score": <0-100>, "status": "good"|"warning"|"missing", "feedback": "<string>" }
  },
  "keywords": {
    "found": ["<keyword1>", "<keyword2>"],
    "missing": ["<keyword1>", "<keyword2>"]
  },
  "improvements": [
    { "priority": "high"|"medium"|"low", "title": "<string>", "description": "<string>" }
  ],
  "strengths": ["<string>", "<string>"],
  "verdict": "strong"|"moderate"|"weak"
}
Return ONLY valid JSON. No markdown, no explanation outside the JSON.`;

    const userPrompt = jobDescription
      ? `Resume:\n${resumeText}\n\nTarget Job Description:\n${jobDescription}`
      : `Resume:\n${resumeText}`;

    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Invalid JSON from Groq");
      result = JSON.parse(match[0]);
    }

    const saved = await prisma.resumeAnalysis.create({
      data: {
        userId: session.user.id,
        fileName: file.name,
        atsScore: result.atsScore,
        overallFeedback: result.overallFeedback,
        result,
      },
    });

    return NextResponse.json({ id: saved.id, result });
  } catch (error) {
    console.error("Resume analyze error:", error);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}
