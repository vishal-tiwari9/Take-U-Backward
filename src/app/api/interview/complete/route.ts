import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, interviewType, difficulty, result } = await req.json();

    const saved = await prisma.mockInterview.create({
      data: {
        userId: session.user.id,
        role,
        interviewType,
        difficulty,
        result,
      },
    });

    return NextResponse.json({ id: saved.id });
  } catch (error) {
    console.error("Interview complete error:", error);
    return NextResponse.json({ error: "Failed to save interview." }, { status: 500 });
  }
}