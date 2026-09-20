import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireServerUser, jsonError } from "@/lib/server-auth";
import { createPakasirPaymentUrl } from "@/lib/pakasir";
import { getPaymentProduct } from "@/lib/payment-products";

export async function POST(req: NextRequest) {
  try {
    const user = await requireServerUser(req);
    const body = await req.json() as { productId?: string };
    const product = getPaymentProduct(body.productId ?? "");
    if (!product) return jsonError("Invalid product.", 400);

    const orderId = `${product.productType.toUpperCase()}-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const record = {
      orderId,
      userId: user.uid,
      productId: product.id,
      productType: product.productType,
      keys: product.keys,
      amount: product.amount,
      status: "pending" as const,
      createdAt: new Date().toISOString(),
    };
    await adminDb().collection("payments").doc(orderId).create(record);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const redirectUrl = `${appUrl}/store/payment/result?order_id=${encodeURIComponent(orderId)}`;
    const slug = process.env.PAKASIR_PROJECT;
    if (!slug) return jsonError("Pakasir is not configured.", 503);
    return NextResponse.json({ paymentUrl: createPakasirPaymentUrl({ slug, amount: product.amount, orderId, redirectUrl }), orderId });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") return jsonError("Unauthorized", 401);
    console.error("Pakasir order creation failed", error);
    return jsonError("Could not create payment order.", 500);
  }
}
