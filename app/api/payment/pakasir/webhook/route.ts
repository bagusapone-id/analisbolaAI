import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { grantVerifiedPayment, verifyPakasirTransaction } from "@/lib/pakasir";

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.PAKASIR_WEBHOOK_SECRET;
    if (webhookSecret) {
      const suppliedSecret = req.headers.get("x-pakasir-webhook-secret")
        ?? req.headers.get("x-webhook-secret")
        ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (suppliedSecret !== webhookSecret) {
        return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
      }
    }

    const payload = await req.json() as {
      amount?: number; order_id?: string; project?: string; status?: string;
      payment_method?: string; completed_at?: string;
    };
    const orderId = payload.order_id;
    const project = process.env.PAKASIR_PROJECT;
    if (!orderId || !project || payload.project !== project || payload.status !== "completed") {
      return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
    }

    const paymentSnap = await adminDb().collection("payments").doc(orderId).get();
    if (!paymentSnap.exists) return NextResponse.json({ error: "Unknown order." }, { status: 404 });
    const localOrder = paymentSnap.data() as {
      orderId: string; userId: string; productId: string; productType: "vip" | "key";
      keys: number; amount: number; status: "pending" | "completed" | "cancelled"; createdAt: string;
    };
    if (payload.amount !== localOrder.amount) return NextResponse.json({ error: "Amount mismatch." }, { status: 400 });
    if (localOrder.status === "completed") return NextResponse.json({ ok: true, alreadyProcessed: true });

    const verified = await verifyPakasirTransaction(orderId, localOrder.amount);
    if (!verified) return NextResponse.json({ error: "Transaction verification failed." }, { status: 400 });
    await grantVerifiedPayment(localOrder, verified.payment_method ?? payload.payment_method, verified.completed_at ?? payload.completed_at);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Pakasir webhook failed", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
