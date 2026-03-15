// PATH: src/app/api/mentor/sessions/route.ts  — CREATE
export const dynamic = "force-dynamic";

import { NextResponse }      from "next/server";
import { auth } from "@/lib/auth";
import { prisma }            from "@/lib/prisma";

// GET /api/mentor/sessions?topic=LearningPath&limit=10
export async function GET(req: Request) {
  try {
    // ─── AUTH v5 CALL ───────────────────────────────────────────
    const session = await auth(); 
    if (!session?.user?.id) {
      return NextResponse.json({ sessions: [] }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic") || undefined;
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "12"), 50);

    const sessions = await prisma.mentorSession.findMany({
      where: { 
        userId: session.user.id, 
        ...(topic ? { topic } : {}) 
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true, 
        topic: true, 
        title: true,
        createdAt: true, 
        updatedAt: true,
        content: true, // Content for the UI cards
      },
    });

    return NextResponse.json({ sessions });
  } catch (err) {
    console.error("[Mentor] sessions fetch failed:", err);
    return NextResponse.json({ sessions: [] }, { status: 500 });
  }
}

// DELETE /api/mentor/sessions?id=xxx
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await prisma.mentorSession.delete({ where: { id, userId: session.user.id } });
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}