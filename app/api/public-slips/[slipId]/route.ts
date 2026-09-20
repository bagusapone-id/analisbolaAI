import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireServerUser, jsonError } from "@/lib/server-auth";
import { getPublicSlipDocs } from "@/lib/public-slips";

async function getPublicSlip(slipId: string) {
  const docs = await getPublicSlipDocs();
  const doc = docs.find((item) => item.id === slipId);
  return doc ?? null;
}

export async function POST(req: NextRequest, context: { params: Promise<{ slipId: string }> }) {
  try {
    const user = await requireServerUser(req);
    const { slipId } = await context.params;
    const db = adminDb();
    const publicSlip = await getPublicSlip(slipId);
    if (!publicSlip) return jsonError("Public Slip not found.", 404);
    if (publicSlip.data().userId === user.uid) return NextResponse.json({ ok: true, alreadyUnlocked: true });
    const unlockRef = db.collection("users").doc(user.uid).collection("unlocked_slips").doc(slipId);
    const userRef = db.collection("users").doc(user.uid);
    const result = await db.runTransaction(async (transaction) => {
      const [unlockSnap, userSnap] = await Promise.all([transaction.get(unlockRef), transaction.get(userRef)]);
      if (unlockSnap.exists) return "already";
      const keys = Number(userSnap.data()?.keys ?? 0);
      if (keys < 1) throw new Error("Key kamu habis.");
      transaction.update(userRef, { keys: keys - 1 });
      transaction.create(unlockRef, { slipId, ownerId: publicSlip.data().userId, createdAt: FieldValue.serverTimestamp() });
      transaction.create(userRef.collection("key_transactions").doc(`unlock_${slipId}`), { type: "unlock_slip", amount: -1, slipId, createdAt: FieldValue.serverTimestamp() });
      return "unlocked";
    });
    return NextResponse.json({ ok: true, alreadyUnlocked: result === "already" });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return jsonError("Unauthorized", 401);
    if (error instanceof Error && error.message === "Key kamu habis.") return jsonError(error.message, 403);
    return jsonError("Could not unlock Slip Jadi.", 500);
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ slipId: string }> }) {
  try {
    const user = await requireServerUser(req);
    const { slipId } = await context.params;
    const publicSlip = await getPublicSlip(slipId);
    if (!publicSlip) return jsonError("Public Slip not found.", 404);
    const ownerId = String(publicSlip.data().userId ?? "");
    const unlocked = ownerId === user.uid || (await adminDb().collection("users").doc(user.uid).collection("unlocked_slips").doc(slipId).get()).exists;
    if (!unlocked) return jsonError("Slip is locked.", 403);
    const matches = await publicSlip.ref.collection("matches").orderBy("createdAt", "desc").get();
    return NextResponse.json({
      slip: { id: publicSlip.id, ...publicSlip.data() },
      matches: matches.docs.map((match) => ({ id: match.id, ...match.data() })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return jsonError("Unauthorized", 401);
    return jsonError("Could not load Slip Jadi.", 500);
  }
}
