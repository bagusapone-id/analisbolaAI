import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireServerUser, jsonError } from "@/lib/server-auth";

async function profile(uid: string) {
  const snap = await adminDb().collection("users").doc(uid).get();
  const data = snap.data() ?? {};
  return { membership: data.membership === "vip" ? "vip" : "free", role: data.role === "admin" ? "admin" : "user" };
}

export async function POST(req: NextRequest, context: { params: Promise<{ slipId: string }> }) {
  try {
    const user = await requireServerUser(req);
    const { slipId } = await context.params;
    const data = await req.json() as Record<string, unknown>;
    const p = await profile(user.uid);
    const db = adminDb();
    const slipRef = db.collection("users").doc(user.uid).collection("slips").doc(slipId);
    const matchRef = slipRef.collection("matches").doc();
    const result = await db.runTransaction(async (transaction) => {
      const slipSnap = await transaction.get(slipRef);
      if (!slipSnap.exists) throw new Error("Slip not found");
      const currentCount = Number(slipSnap.data()?.matchCount ?? 0);
      if (p.membership === "free" && currentCount >= 3) throw new Error("Free users can create only 3 matches. Upgrade to VIP.");
      transaction.create(matchRef, { ...data, slipId, userId: user.uid, createdAt: FieldValue.serverTimestamp() });
      transaction.update(slipRef, { matchCount: currentCount + 1, updatedAt: FieldValue.serverTimestamp() });
      return matchRef.id;
    });
    return NextResponse.json({ matchId: result });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return jsonError("Unauthorized", 401);
    if (error instanceof Error && (error.message.includes("Free users") || error.message === "Slip not found")) return jsonError(error.message, 403);
    console.error("Create match failed", error);
    return jsonError("Could not create match.", 500);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ slipId: string }> }) {
  try {
    const user = await requireServerUser(req);
    const { slipId } = await context.params;
    const matchId = new URL(req.url).searchParams.get("matchId");
    if (!matchId) return jsonError("Missing matchId.", 400);

    // Only VIP members and admins can delete Matches
    const p = await profile(user.uid);
    if (p.membership !== "vip" && p.role !== "admin") {
      return jsonError("Only VIP members can delete Matches.", 403);
    }

    const db = adminDb();
    const slipRef = db.collection("users").doc(user.uid).collection("slips").doc(slipId);
    const matchRef = slipRef.collection("matches").doc(matchId);
    await db.runTransaction(async (transaction) => {
      const [slipSnap, matchSnap] = await Promise.all([transaction.get(slipRef), transaction.get(matchRef)]);
      if (!slipSnap.exists || !matchSnap.exists) throw new Error("Match not found");
      transaction.delete(matchRef);
      transaction.update(slipRef, { matchCount: Math.max(0, Number(slipSnap.data()?.matchCount ?? 1) - 1), updatedAt: FieldValue.serverTimestamp() });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return jsonError("Unauthorized", 401);
    if (error instanceof Error && error.message === "Match not found") return jsonError(error.message, 404);
    return jsonError("Could not delete match.", 500);
  }
}
