import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { requireServerUser, jsonError } from "@/lib/server-auth";

async function getProfile(uid: string) {
  const snap = await adminDb().collection("users").doc(uid).get();
  const data = snap.data() ?? {};
  return { membership: data.membership === "vip" ? "vip" : "free", role: data.role === "admin" ? "admin" : "user" } as const;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireServerUser(req);
    const body = await req.json() as { name?: string; description?: string; visibility?: "private" | "public" };
    const name = body.name?.trim();
    if (!name) return jsonError("Slip name is required.", 400);
    const profile = await getProfile(user.uid);
    if (profile.membership === "free") {
      const existing = await adminDb().collection("users").doc(user.uid).collection("slips").limit(1).get();
      if (!existing.empty) return jsonError("Free users can create only one Slip. Upgrade to VIP.", 403);
    }
    const visibility = profile.role === "admin" && body.visibility === "public" ? "public" : "private";
    const ref = await adminDb().collection("users").doc(user.uid).collection("slips").add({
      name, description: body.description?.trim() ?? "", visibility, ownerRole: profile.role,
      userId: user.uid, matchCount: 0, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ slipId: ref.id });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return jsonError("Unauthorized", 401);
    console.error("Create slip failed", error);
    return jsonError("Could not create Slip.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireServerUser(req);
    const slipId = new URL(req.url).searchParams.get("slipId");
    if (!slipId) return jsonError("Missing slipId.", 400);

    // Only VIP members and admins can delete Slips
    const profile = await getProfile(user.uid);
    if (profile.membership !== "vip" && profile.role !== "admin") {
      return jsonError("Only VIP members can delete Slips.", 403);
    }

    const db = adminDb();
    const slipRef = db.collection("users").doc(user.uid).collection("slips").doc(slipId);
    // Verify the slip belongs to this user before deleting
    const slipSnap = await slipRef.get();
    if (!slipSnap.exists) return jsonError("Slip not found.", 404);
    const matches = await slipRef.collection("matches").get();
    const batch = db.batch();
    matches.docs.forEach((match) => batch.delete(match.ref));
    batch.delete(slipRef);
    await batch.commit();
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return jsonError("Unauthorized", 401);
    return jsonError("Could not delete Slip.", 500);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireServerUser(req);
    const slipId = new URL(req.url).searchParams.get("slipId");
    const body = await req.json() as { visibility?: "private" | "public" };
    if (!slipId || !body.visibility) return jsonError("Invalid Slip update.", 400);
    const profile = await getProfile(user.uid);
    if (profile.role !== "admin") return jsonError("Only admins can change Slip visibility.", 403);
    await adminDb().collection("users").doc(user.uid).collection("slips").doc(slipId).update({ visibility: body.visibility, ownerRole: "admin", updatedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return jsonError("Unauthorized", 401);
    return jsonError("Could not update Slip.", 500);
  }
}
