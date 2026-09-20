import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireServerUser, jsonError } from "@/lib/server-auth";
import { getPublicSlipDocs } from "@/lib/public-slips";

export async function GET(req: NextRequest) {
  try {
    const user = await requireServerUser(req);
    const publicDocs = await getPublicSlipDocs();
    const db = adminDb();
    const unlockedSnap = await db.collection("users").doc(user.uid).collection("unlocked_slips").get();
    const unlocked = new Set(unlockedSnap.docs.map((doc) => doc.id));
    const slips = publicDocs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, ownerId: String(data.userId ?? ""), name: data.name ?? "", description: data.description ?? "", matchCount: Number(data.matchCount ?? 0), unlocked: unlocked.has(doc.id) || data.userId === user.uid };
    }).filter((slip) => slip.ownerId !== user.uid);
    return NextResponse.json({ slips });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return jsonError("Unauthorized", 401);
    if (error instanceof Error && error.message.includes("credentials")) return jsonError("Server configuration error.", 500);
    console.error("Loading public Slips failed", error);
    return jsonError("Could not load public Slips.", 500);
  }
}
