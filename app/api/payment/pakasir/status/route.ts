import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireServerUser, jsonError } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireServerUser(req);
    const orderId = new URL(req.url).searchParams.get("order_id");
    if (!orderId) return jsonError("Missing order_id.", 400);
    const snap = await adminDb().collection("payments").doc(orderId).get();
    if (!snap.exists || snap.data()?.userId !== user.uid) return jsonError("Payment not found.", 404);
    const data = snap.data() ?? {};
    return NextResponse.json({
      orderId: data.orderId,
      productId: data.productId,
      productType: data.productType,
      keys: data.keys,
      amount: data.amount,
      status: data.status,
      paymentMethod: data.paymentMethod ?? null,
      createdAt: data.createdAt,
      completedAt: data.completedAt ?? null,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return jsonError("Unauthorized", 401);
    return jsonError("Could not load payment status.", 500);
  }
}
