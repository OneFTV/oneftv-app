import { NextRequest, NextResponse } from "next/server";
import { createFeedItem, listFeed, type FeedKind } from "@/lib/liveFeedStore";

const ALLOWED_KINDS: FeedKind[] = ["status", "error", "task", "action", "note"];

export async function GET() {
  try {
    const items = await listFeed();
    const summary = {
      total: items.length,
      open: items.filter((item) => !item.resolved).length,
      errors: items.filter((item) => item.kind === "error" && !item.resolved).length,
      actionRequired: items.filter((item) => item.actionRequired && !item.resolved).length,
    };

    return NextResponse.json({ items, summary }, { status: 200 });
  } catch (error) {
    console.error("Live feed GET error:", error);
    return NextResponse.json({ error: "Failed to load live feed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const author = typeof body.author === "string" ? body.author : "";
    const kind = body.kind as FeedKind;
    const message = typeof body.message === "string" ? body.message : "";
    const details = typeof body.details === "string" ? body.details : undefined;
    const actionRequired = Boolean(body.actionRequired);
    const actionOwner =
      typeof body.actionOwner === "string" ? body.actionOwner : undefined;

    if (!author.trim()) {
      return NextResponse.json({ error: "author is required" }, { status: 400 });
    }

    if (!ALLOWED_KINDS.includes(kind)) {
      return NextResponse.json({ error: "invalid kind" }, { status: 400 });
    }

    if (!message.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const item = await createFeedItem({
      author,
      kind,
      message,
      details,
      actionRequired,
      actionOwner,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Live feed POST error:", error);
    return NextResponse.json({ error: "Failed to create feed item" }, { status: 500 });
  }
}
