export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGroq } from "@/lib/groq";
import { prisma } from "@/lib/prisma";

// ── Job URL scraper (server-side, best-effort) ─────────────────────
async function scrapeJobDescription(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 2000);
  } catch {
    return "";
  }
}

// ── System prompt — the core of the feature ────────────────────────
function buildSystemPrompt(messageType: string): string {
  const isEmail   = messageType === "cold_email";
  const isConnect = messageType === "linkedin_connect";

  const lengthGuide = isEmail
    ? "150–200 words for the email body"
    : isConnect
    ? "under 300 characters (hard LinkedIn limit)"
    : "80–120 words (LinkedIn DM — mobile-first, get to the point fast)";

  return `You are a top-tier career strategist who writes cold outreach that actually gets replies. \
You have placed hundreds of engineers at FAANG, unicorn startups, and Fortune 500 companies.

YOUR CORE PHILOSOPHY:
- Lead with VALUE and RELEVANCE, never desperation
- Sound like a human who did their homework, not a bot filling a template
- The reader's inbox is full of forgettable emails. Yours must stop the scroll.
- Specific beats generic every time. "I rebuilt your checkout concept in 48h" beats "I'm passionate about your company"

HARD RULES — NEVER BREAK THESE:
1. NEVER open with: "I hope this email finds you well", "My name is", "I am writing to", \
"I wanted to reach out", "I hope you're doing well", or any variation of these robotic openers
2. NEVER use corporate jargon: "synergy", "leverage", "circle back", "touch base", \
"passionate about XYZ", "team player", "go-getter", "results-driven", "value-add"
3. NEVER beg. Do not say "I would love the opportunity", "I'd be so grateful if", \
"Please consider my application", "I humbly request"
4. NEVER write walls of text — use white space, short punchy sentences, scannable structure
5. NEVER invent fake metrics or achievements — only work with what you're given
6. ALWAYS use [Variable Tags] in square brackets where the candidate should personalise \
before sending (e.g. [Hiring Manager Name], [Company Name], [Recent Product Launch], [Specific Team Name])

TONE CALIBRATION:
- professional : Confident, crisp, boardroom-ready. No small talk. Respects the reader's time implicitly.
- casual       : Sounds like a sharp friend who works in tech. Slightly informal, but never sloppy or desperate.
- bold         : Makes a direct, almost audacious claim upfront. High-risk, high-reward. For very confident candidates.
- warm         : Human, empathetic, curious about the company's mission. Best for mission-driven orgs / nonprofits.

OUTPUT FORMAT for ${isEmail ? "Cold Email" : isConnect ? "LinkedIn Connection Request" : "LinkedIn DM"}:
${
  isEmail
    ? `- First line: Subject: [your subject line] (punchy, 6–10 words, NO "Following Up" or "Quick Question")
- Blank line
- Body: ${lengthGuide}
- End with ONE clear, low-friction CTA — e.g. "15 minutes this week?" NOT "Please review my attached resume"`
    : isConnect
    ? `- Just the connection note: ${lengthGuide}
- One specific hook that proves research, one reason to connect, no hard ask yet`
    : `- Body only: ${lengthGuide}
- Open with an observation or compliment that proves real research
- One anchor (their product / recent news / mutual connection)
- Your single strongest proof point tied to their specific context
- End with one soft, easy CTA`
}

QUALITY BAR: If a senior recruiter at Google received this, would they pause scrolling and reply? \
If not, rewrite from scratch.`;
}

// ── User prompt ────────────────────────────────────────────────────
function buildUserPrompt(body: {
  messageType: string;
  tone: string;
  targetRole: string;
  companyName: string;
  hiringManager: string;
  jobDescription: string;
  userProjects: string;
  userUSP: string;
  extraContext: string;
}): string {
  return `Generate a ${body.tone} ${body.messageType.replace(/_/g, " ")} for the following candidate.

TARGET:
- Company: ${body.companyName}
- Role applying for: ${body.targetRole}
- Recipient: ${body.hiringManager || "[Hiring Manager Name] — unknown, use appropriate professional salutation"}

CANDIDATE PROFILE:
- Unique Value Proposition: ${body.userUSP}
- Key Projects & Achievements: ${body.userProjects}
${body.extraContext ? `- Extra context / hook: ${body.extraContext}` : ""}

${
  body.jobDescription
    ? `JOB DESCRIPTION EXCERPT (use to anchor relevance):\n${body.jobDescription.slice(0, 800)}\n`
    : ""
}
REQUIREMENTS:
1. Make the opening line IMPOSSIBLE to scroll past
2. Reference at least ONE specific project from the candidate's list and connect it directly \
to ${body.companyName}'s actual work, product, or stated needs
3. Insert [Variable Tags] wherever the candidate should personalise further \
(e.g. [Hiring Manager Name], [Specific Feature at ${body.companyName}], [Recent News About ${body.companyName}])
4. Respect length guidelines strictly for this message type
5. Tone must be: ${body.tone}

Output ONLY the final message. No preamble, no "Here is your email:", no markdown code fences.${
    body.messageType === "cold_email" ? "\nStart the very first line with: Subject: [your subject line]" : ""
  }`;
}

// ── Route handler ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      messageType  = "cold_email",
      tone         = "professional",
      targetRole,
      companyName,
      hiringManager = "",
      jobUrl        = "",
      userProjects,
      userUSP,
      extraContext  = "",
    } = body;

    if (!targetRole || !companyName || !userProjects || !userUSP) {
      return NextResponse.json(
        { error: "Missing required fields: targetRole, companyName, userProjects, userUSP" },
        { status: 400 }
      );
    }

    // Server-side URL scrape
    let jobDescription: string = body.jobDescription ?? "";
    if (jobUrl && !jobDescription) {
      jobDescription = await scrapeJobDescription(jobUrl);
    }

    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: buildSystemPrompt(messageType) },
        {
          role: "user",
          content: buildUserPrompt({
            messageType, tone, targetRole, companyName,
            hiringManager, jobDescription, userProjects, userUSP, extraContext,
          }),
        },
      ],
      temperature: 0.75,
      max_tokens:  600,
    });

    const raw = completion.choices[0]?.message?.content?.trim() ?? "";

    // Parse subject line from email output
    let generatedText = raw;
    let subject: string | null = null;
    if (messageType === "cold_email") {
      const m = raw.match(/^Subject:\s*(.+)/m);
      if (m) {
        subject       = m[1].trim();
        generatedText = raw.replace(/^Subject:\s*.+\n\n?/, "").trim();
      }
    }

    // Save to database
    const saved = await prisma.outreachMessage.create({
      data: {
        userId:        session.user.id,
        messageType,   tone,          targetRole,    companyName,
        hiringManager: hiringManager  || null,
        jobUrl:        jobUrl         || null,
        jobDescription: jobDescription || null,
        userProjects,  userUSP,
        extraContext:  extraContext    || null,
        generatedText, subject,
        charCount: generatedText.length,
      },
    });

    return NextResponse.json({
      id:             saved.id,
      generatedText,
      subject,
      charCount:      generatedText.length,
      jobScraped:     jobDescription.length > 0,
    });
  } catch (error) {
    console.error("Outreach generate error:", error);
    return NextResponse.json(
      { error: "Generation failed. Please try again." },
      { status: 500 }
    );
  }
}