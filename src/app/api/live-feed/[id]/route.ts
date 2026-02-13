import { NextRequest, NextResponse } from "next/server";
import { updateFeedItem } from "@/lib/liveFeedStore";

type FeedAction = "resolve" | "reopen" | "claim" | "unclaim";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const action = body.action as FeedAction;
    const actor = typeof body.actor === "string" ? body.actor.trim() : "";

    if (!["resolve", "reopen", "claim", "unclaim"].includes(action)) {
      return NextResponse.json({ error: "invalid action" }, { status: 400 });
    }

    if (action === "claim" && !actor) {
      return NextResponse.json(
        { error: "actor is required when claiming an item" },
        { status: 400 }
      );
    }

    const updated = await updateFeedItem(params.id, (item) => {
      if (action === "resolve") {
        return { ...item, resolved: true };
      }

      if (action === "reopen") {
        return { ...item, resolved: false };
      }

      if (action === "claim") {
        return { ...item, actionOwner: actor };
      }

      return { ...item, actionOwner: undefined };
    });

    if (!updated) {
      return NextResponse.json({ error: "item not found" }, { status: 404 });
    }

    return NextResponse.json({ item: updated }, { status: 200 });
  } catch (error) {
    console.error("Live feed PATCH error:", error);
    return NextResponse.json({ error: "Failed to update feed item" }, { status: 500 });
  }
}
