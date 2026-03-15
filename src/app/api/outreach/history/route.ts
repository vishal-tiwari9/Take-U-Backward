// PATH: src/app/api/outreach/history/route.ts  (CREATE new file)
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — paginated history
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit  = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);
    const cursor = searchParams.get("cursor") ?? undefined;

    const messages = await prisma.outreachMessage.findMany({
      where:   { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take:    limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true, messageType: true, tone: true,
        targetRole: true, companyName: true,
        hiringManager: true, subject: true,
        generatedText: true, charCount: true, createdAt: true,
      },
    });

    const hasMore   = messages.length > limit;
    const items     = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({ messages: items, nextCursor, hasMore });
  } catch (error) {
    console.error("Outreach history error:", error);
    return NextResponse.json({ error: "Failed to fetch history." }, { status: 500 });
  }
}

// DELETE — remove a single message (only owner can delete)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.outreachMessage.deleteMany({
      where: { id, userId: session.user.id }, // userId guard prevents deleting other users' messages
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}