import { NextResponse } from "next/server";
import { getPopularitySnapshot } from "@/modules/popularity/popularity.service";

export async function GET() {
  try {
    const snapshot = getPopularitySnapshot();
    return NextResponse.json(snapshot, { status: 200 });
  } catch (error) {
    console.error("Popularity snapshot error:", error);
    return NextResponse.json(
      { error: "Failed to load popularity snapshot" },
      { status: 500 }
    );
  }
}
