export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGroq } from "@/lib/groq";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      linkedinUrl,
      currentRole,
      industry,
      experienceLevel,
      yearsOfExperience,
      targetRoles,
      headline,
      about,
      skills,
      education,
      achievements,
    } = body;

    if (!currentRole || !industry || !targetRoles || !headline || !about) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert LinkedIn profile coach and career strategist.
Analyze the provided LinkedIn profile information and return a JSON object with EXACTLY this structure:
{
  "overallScore": <number 0-100>,
  "verdict": "excellent"|"good"|"moderate"|"weak",
  "overallFeedback": "<3-4 sentence executive summary of the profile>",
  "sectionScores": {
    "headline": { "score": <0-100>, "feedback": "<string>" },
    "about": { "score": <0-100>, "feedback": "<string>" },
    "experience": { "score": <0-100>, "feedback": "<string>" },
    "skills": { "score": <0-100>, "feedback": "<string>" },
    "education": { "score": <0-100>, "feedback": "<string>" },
    "completeness": { "score": <0-100>, "feedback": "<string>" }
  },
  "strengths": ["<string>", "<string>", "<string>"],
  "weaknesses": ["<string>", "<string>", "<string>"],
  "areasOfImprovement": [
    { "area": "<string>", "action": "<string>", "impact": "high"|"medium"|"low" }
  ],
  "jobRecommendations": [
    { "title": "<string>", "reason": "<string>", "matchScore": <0-100> }
  ],
  "linkedInPack": {
    "optimizedHeadline": "<string — max 220 chars, keyword-rich>",
    "optimizedAbout": "<string — 3 paragraphs, storytelling format, ends with CTA>",
    "skillsToAdd": ["<skill1>", "<skill2>", "<skill3>", "<skill4>", "<skill5>"],
    "connectionMessage": "<string — personalized connection request template, max 300 chars>",
    "featuredSectionIdea": "<string — what to put in LinkedIn Featured section>"
  }
}
Return ONLY valid JSON. No markdown, no explanation outside the JSON.`;

    const userPrompt = `LinkedIn Profile Data:
- URL: ${linkedinUrl || "Not provided"}
- Current Role: ${currentRole}
- Industry: ${industry}
- Experience Level: ${experienceLevel}
- Years of Experience: ${yearsOfExperience}
- Target Roles: ${targetRoles}
- Current Headline: ${headline}
- About/Summary: ${about}
- Skills: ${skills || "Not provided"}
- Education: ${education || "Not provided"}
- Key Achievements: ${achievements || "Not provided"}`;

    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 3000,
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

    const saved = await prisma.linkedInAnalysis.create({
      data: {
        userId: session.user.id,
        currentRole,
        targetRoles,
        overallScore: result.overallScore,
        result,
      },
    });

    return NextResponse.json({ id: saved.id, result });
  } catch (error) {
    console.error("LinkedIn analyze error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
