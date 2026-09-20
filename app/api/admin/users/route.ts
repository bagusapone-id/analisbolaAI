import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireServerUser, jsonError } from "@/lib/server-auth";

async function requireAdmin(req: NextRequest) {
  const authUser = await requireServerUser(req);
  const snap = await adminDb().collection("users").doc(authUser.uid).get();
  if (snap.data()?.role !== "admin") throw new Error("Forbidden");
  return authUser;
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const snap = await adminDb().collection("users").get();
    return Response.json({ users: snap.docs.map((doc) => ({ id: doc.id, email: doc.data().email ?? "", membership: doc.data().membership === "vip" ? "vip" : "free", keys: Number(doc.data().keys ?? 0), role: doc.data().role === "admin" ? "admin" : "user" })) });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return jsonError("Unauthorized", 401);
    if (error instanceof Error && error.message === "Forbidden") return jsonError("Forbidden", 403);
    return jsonError("Could not load users.", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req);
    const body = await req.json() as { userId?: string; membership?: "free" | "vip"; keys?: number };
    const keys = body.keys;
    if (!body.userId || typeof keys !== "number" || !Number.isInteger(keys) || keys < 0 || !body.membership) return jsonError("Invalid member update.", 400);
    const db = adminDb();
    const userRef = db.collection("users").doc(body.userId);
    const auditRef = userRef.collection("key_transactions").doc(`admin_${Date.now()}`);
    await db.runTransaction(async (transaction) => {
      const current = await transaction.get(userRef);
      const before = Number(current.data()?.keys ?? 0);
      transaction.set(userRef, { membership: body.membership, keys }, { merge: true });
      transaction.create(auditRef, { type: "admin_adjustment", amount: keys - before, adminId: admin.uid, createdAt: FieldValue.serverTimestamp() });
    });
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return jsonError("Unauthorized", 401);
    if (error instanceof Error && error.message === "Forbidden") return jsonError("Forbidden", 403);
    return jsonError("Could not update member.", 500);
  }
}
