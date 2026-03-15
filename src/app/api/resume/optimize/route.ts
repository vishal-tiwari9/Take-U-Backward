export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGroq } from "@/lib/groq";
import latex from "node-latex";
import { Readable } from "stream";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { resumeData } = body;

        if (!resumeData) {
            return NextResponse.json({ error: "No resume data provided" }, { status: 400 });
        }

        // ── 1. Ask Groq to generate improved LaTeX ──
        const systemPrompt = `You are an expert resume writer and LaTeX developer.
Your task is to take a resume analysis JSON and generate an improved, ATS-optimized resume as compilable LaTeX code.

STRICT RULES — violating any of these will break the system:
1. Output ONLY raw LaTeX code. Start directly with \\documentclass. No markdown, no backticks, no explanation, no conversational text.
2. You MUST use the exact preamble, layout, and custom commands provided in the "TEMPLATE STRUCTURE" below. 
3. Do NOT use any custom .cls or .sty files. The provided template uses only standard TeX Live packages.
4. Incorporate all strengths from the analysis and address all high-priority improvements.
5. Use strong action verbs and quantified achievements in all bullet points.
6. Ensure the skills section directly matches the keywords marked as "missing" in the analysis (where applicable).
7. The final LaTeX must compile with pdflatex without errors.

=========================================
REQUIRED TEMPLATE STRUCTURE & MACROS
=========================================
You must use this EXACT preamble and these custom commands for formatting the document. Do not invent your own formatting commands.

\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}
\\usepackage{fontawesome5}
\\usepackage[T1]{fontenc}
\\usepackage{tgheros}
\\renewcommand*\\familydefault{\\sfdefault}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{0in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}
\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat {\\section}{\\bfseries \\vspace{2pt} \\raggedright \\large}{}{0em}{}[\\color{black} {\\titlerule[2pt]} \\vspace{-4pt}]

\\newcommand{\\resumeItem}[1]{\\item\\small{{#1 \\vspace{-1pt}}}}
\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-1pt}\\item
    \\begin{tabular*}{\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & {\\color{darkgray}\\small #2}\\vspace{1pt}\\\\
      \\textit{#3} & {\\color{darkgray} \\small #4}\\\\
    \\end{tabular*}\\vspace{-4pt}
}
\\newcommand{\\resumeProjectHeading}[2]{
    \\item
    \\begin{tabular*}{\\textwidth}{l@{\\extracolsep{\\fill}}r}
      #1 & {\\color{darkgray}} \\\\
    \\end{tabular*}\\vspace{-4pt}
}
\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{0pt}}

=========================================
DOCUMENT BODY INSTRUCTIONS
=========================================
Start the document with \\begin{document}.

1. HEADER: Center the user's name in \\Huge \\textbf. Below it, list contact info using standard symbols (e.g., \\faPhone, \\faEnvelope, \\faLinkedin, \\faGithub).
2. EXPERIENCE: Use \\section{EXPERIENCE}. Wrap the list in \\resumeSubHeadingListStart and \\resumeSubHeadingListEnd. Use \\resumeSubheading for the job title/company/dates/location, and \\resumeItem inside \\resumeItemListStart for bullets.
3. PROJECTS: Use \\section{PROJECTS}. Use \\resumeProjectHeading for project title/dates, and \\resumeItem for bullets.
4. EDUCATION: Use \\section{EDUCATION}. Use \\resumeSubheading.
5. SKILLS: Use \\section{SKILLS}. Format as a simple itemized list without bullets, using \\textbf{Category}: List of skills.

End the document with \\end{document}.
Generate the resume now.`;

        const userPrompt = `Here is the resume analysis data. Generate an optimized LaTeX resume based on this:

${JSON.stringify(resumeData, null, 2)}

Remember: Output ONLY the raw LaTeX code starting with \\documentclass.`;

        const completion = await getGroq().chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.2,
            max_tokens: 4000,
        });

        let latexCode = completion.choices[0]?.message?.content ?? "";

        // Strip any markdown fences the model might have added despite instructions
        latexCode = latexCode
            .replace(/^```latex\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/```\s*$/i, "")
            .trim();

        // Validate it looks like LaTeX
        if (!latexCode.startsWith("\\documentclass")) {
            console.error("Groq returned non-LaTeX output:", latexCode.slice(0, 200));
            return NextResponse.json(
                { error: "AI did not return valid LaTeX. Please try again." },
                { status: 500 }
            );
        }

        // ── 2. Compile LaTeX → PDF using node-latex ──
        const pdfBuffer = await compileLaTeX(latexCode);

        // ── 3. Return PDF as download ──
        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": 'attachment; filename="optimized-resume.pdf"',
                "Content-Length": pdfBuffer.length.toString(),
            },
        });
    } catch (error) {
        console.error("Resume optimize error:", error);
        return NextResponse.json(
            { error: "Optimization failed. Please try again." },
            { status: 500 }
        );
    }
}

function compileLaTeX(latexSource: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const stream = latex(latexSource, {
            cmd: "pdflatex",
            passes: 2, // two passes for proper rendering
        });

        const chunks: Buffer[] = [];

        stream.on("data", (chunk: Buffer) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", (err: Error) => {
            console.error("LaTeX compile error:", err);
            reject(new Error(`LaTeX compilation failed: ${err.message}`));
        });
    });
}
