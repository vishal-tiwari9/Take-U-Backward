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
      projectName,
      projectType,
      techStack,
      yourRole,
      teamSize,
      duration,
      problemSolved,
      whatYouBuilt,
      impact,
      targetRole,
    } = body;

    if (!projectName || !whatYouBuilt || !techStack) {
      return NextResponse.json(
        { error: "Project name, what you built, and tech stack are required." },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an expert technical resume writer and career coach specializing in software engineering projects.
Your task is to transform raw project information into multiple polished, ATS-optimized formats.

Return ONLY a JSON object with this exact structure:
{
  "projectName": "<cleaned up project name>",
  "oneLiner": "<one powerful sentence describing the project, max 25 words>",
  "resumeBullets": [
    "<bullet 1 — starts with strong action verb, quantified impact, 20-30 words>",
    "<bullet 2 — focuses on technical achievement, 20-30 words>",
    "<bullet 3 — focuses on outcome/result, 20-30 words>"
  ],
  "linkedInDescription": "<3-4 sentence paragraph for LinkedIn featured section, storytelling format, includes problem → solution → impact arc>",
  "portfolioDescription": "<rich 2-paragraph description suitable for a portfolio website, technical depth + business impact>",
  "techHighlights": ["<tech/concept 1>", "<tech/concept 2>", "<tech/concept 3>", "<tech/concept 4>", "<tech/concept 5>"],
  "suggestedMetrics": ["<made-up but realistic metric 1 to quantify impact>", "<metric 2>", "<metric 3>"],
  "improvements": [
    { "area": "<area>", "suggestion": "<specific improvement to make the project stronger on resume>" }
  ],
  "keywords": ["<ATS keyword 1>", "<ATS keyword 2>", "<ATS keyword 3>", "<ATS keyword 4>", "<ATS keyword 5>"],
  "strengthScore": <number 0-100 rating how impressive this project is for job applications>,
  "strengthFeedback": "<2 sentence explanation of the score and what would make it stronger>"
}

Rules:
- Start every resume bullet with a past-tense action verb (Built, Engineered, Designed, Developed, Implemented, Architected, etc.)
- Include specific technologies from the tech stack in bullets
- Quantify impact wherever possible — if the user didn't provide metrics, infer realistic ones
- For suggestedMetrics, provide realistic metrics the user could add (e.g. "Reduced load time by 40%", "Served 500+ users")
- Make the language confident and achievement-focused
- Return ONLY valid JSON. No markdown, no explanation.`;

    const userPrompt = `Project Information:
- Project Name: ${projectName}
- Project Type: ${projectType || "Personal/Side Project"}
- Tech Stack: ${techStack}
- Your Role: ${yourRole || "Full Stack Developer"}
- Team Size: ${teamSize || "Solo"}
- Duration: ${duration || "Not specified"}
- Problem Solved: ${problemSolved || "Not specified"}
- What You Built: ${whatYouBuilt}
- Impact / Results: ${impact || "Not specified"}
- Target Role: ${targetRole || "Software Engineer"}`;

    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
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

    await prisma.projectRewrite.create({
      data: {
        userId: session.user.id,
        projectName,
        result,
      },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Project rewrite error:", error);
    return NextResponse.json(
      { error: "Rewrite failed. Please try again." },
      { status: 500 }
    );
  }
}
