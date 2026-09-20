import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireServerUser, jsonError } from "@/lib/server-auth";

export async function POST(req: NextRequest) {
  try {
    const user = await requireServerUser(req);
    const data = await req.json() as Record<string, unknown>;
    const db = adminDb();
    const profileSnap = await db.collection("users").doc(user.uid).get();
    const profile = profileSnap.data() ?? {};
    const membership = profile.membership === "vip" ? "vip" : "free";
    const role = profile.role === "admin" ? "admin" : "user";

    // Free users: enforce a hard cap of 3 total matches across the legacy flat collection
    if (membership !== "vip" && role !== "admin") {
      const existing = await db.collection("users").doc(user.uid).collection("matches").limit(3).get();
      if (existing.size >= 3) {
        return jsonError("Free users can create only 3 matches. Upgrade to VIP.", 403);
      }
    }

    const ref = await db.collection("users").doc(user.uid).collection("matches").add({
      ...data,
      userId: user.uid,
      createdAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ matchId: ref.id });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return jsonError("Unauthorized", 401);
    return jsonError("Could not create match.", 500);
  }
}
