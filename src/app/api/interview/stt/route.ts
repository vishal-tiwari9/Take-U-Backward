export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    if (audioFile.size < 1000) {
      return NextResponse.json({ transcript: "" });
    }

    // Forward to Groq Whisper
    const groqForm = new FormData();
    groqForm.append("file", audioFile, "recording.webm");
    groqForm.append("model", "whisper-large-v3");
    groqForm.append("language", "en");
    groqForm.append("response_format", "json");

    const response = await fetch(
      "https://api.groq.com/openai/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: groqForm,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Groq Whisper error:", err);
      return NextResponse.json(
        { error: "Transcription failed. Please try again." },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ transcript: data.text ?? "" });
  } catch (error) {
    console.error("STT error:", error);
    return NextResponse.json(
      { error: "Speech recognition failed." },
      { status: 500 }
    );
  }
}
