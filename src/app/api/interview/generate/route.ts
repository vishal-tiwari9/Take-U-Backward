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

    const { role, interviewType, difficulty, techStack, yearsOfExperience } = await req.json();

    if (!role || !interviewType || !difficulty) {
      return NextResponse.json({ error: "Role, interview type, and difficulty are required." }, { status: 400 });
    }

    const systemPrompt = `You are an expert technical interviewer at a top tech company.
Generate exactly 5 interview questions based on the provided context.

Return ONLY a JSON array with this exact structure:
[
  {
    "id": 1,
    "question": "<the interview question>",
    "category": "<Behavioral|Technical|System Design|Problem Solving|HR>",
    "hint": "<a subtle hint to guide the candidate, 1 sentence>",
    "expectedPoints": ["<key point 1>", "<key point 2>", "<key point 3>"]
  }
]

Rules:
- Questions must be realistic and match the difficulty level
- Mix question types appropriate to the interview type
- For technical interviews: include coding concepts, system design, debugging
- For behavioral: use STAR-method style questions
- For HR: focus on motivation, culture fit, career goals
- Make questions progressively harder (question 5 harder than question 1)
- Return ONLY the JSON array. No markdown, no explanation.`;

    const userPrompt = `Generate interview questions for:
- Role: ${role}
- Interview Type: ${interviewType}
- Difficulty: ${difficulty}
- Tech Stack: ${techStack || "General"}
- Years of Experience: ${yearsOfExperience || "Not specified"}`;

    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 1500,
    });

    const raw = completion.choices[0]?.message?.content ?? "";

    let questions;
    try {
      questions = JSON.parse(raw);
    } catch {
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Invalid JSON from Groq");
      questions = JSON.parse(match[0]);
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Interview generate error:", error);
    return NextResponse.json({ error: "Failed to generate questions. Please try again." }, { status: 500 });
  }
}
