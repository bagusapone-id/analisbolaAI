import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireServerUser, jsonError } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireServerUser(req);
    const ref = adminDb().collection("users").doc(user.uid);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({ email: user.email ?? "", membership: "free", keys: 0, role: "user" }, { merge: true });
      return NextResponse.json({ email: user.email ?? "", membership: "free", keys: 0, role: "user" });
    }
    const data = snap.data() ?? {};
    return NextResponse.json({ email: data.email ?? user.email ?? "", membership: data.membership === "vip" ? "vip" : "free", keys: Number(data.keys ?? 0), role: data.role === "admin" ? "admin" : "user" });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return jsonError("Unauthorized", 401);
    console.error("[profile] error:", error instanceof Error ? error.message : error);
    return jsonError("Could not load profile.", 500);
  }
}
