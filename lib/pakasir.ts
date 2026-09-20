import { adminDb } from "./firebase-admin";
import type { PaymentRecord } from "./types";

export function createPakasirPaymentUrl({
  slug,
  amount,
  orderId,
  redirectUrl,
}: {
  slug: string;
  amount: number;
  orderId: string;
  redirectUrl?: string;
}) {
  const url = new URL(`https://app.pakasir.com/pay/${encodeURIComponent(slug)}/${amount}`);
  url.searchParams.set("order_id", orderId);
  if (redirectUrl) url.searchParams.set("redirect", redirectUrl);
  return url.toString();
}

export async function verifyPakasirTransaction(orderId: string, amount: number) {
  const project = process.env.PAKASIR_PROJECT;
  const apiKey = process.env.PAKASIR_API_KEY;
  if (!project || !apiKey) throw new Error("Pakasir credentials are not configured.");

  const url = new URL("https://app.pakasir.com/api/transactiondetail");
  url.searchParams.set("project", project);
  url.searchParams.set("amount", String(amount));
  url.searchParams.set("order_id", orderId);
  url.searchParams.set("api_key", apiKey);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  const body = await response.json() as { transaction?: {
    order_id?: string; amount?: number; project?: string; status?: string;
    payment_method?: string; completed_at?: string;
  } };
  const transaction = body.transaction;
  if (!transaction || transaction.order_id !== orderId || transaction.amount !== amount || transaction.project !== project || transaction.status !== "completed") return null;
  return transaction;
}

export async function grantVerifiedPayment(localOrder: PaymentRecord, paymentMethod?: string, completedAt?: string) {
  const db = adminDb();
  const paymentRef = db.collection("payments").doc(localOrder.orderId);
  const userRef = db.collection("users").doc(localOrder.userId);
  const auditRef = userRef.collection("key_transactions").doc(`payment_${localOrder.orderId}`);

  await db.runTransaction(async (transaction) => {
    const paymentSnap = await transaction.get(paymentRef);
    if (!paymentSnap.exists) throw new Error("Payment not found");
    const current = paymentSnap.data() as PaymentRecord;
    if (current.status === "completed") return;

    const userSnap = await transaction.get(userRef);
    const user = userSnap.exists ? userSnap.data() ?? {} : {};
    const currentKeys = Number(user.keys ?? 0);
    const nextData: Record<string, unknown> = {
      status: "completed",
      paymentMethod: paymentMethod ?? current.paymentMethod ?? "unknown",
      completedAt: completedAt ?? new Date().toISOString(),
    };
    if (localOrder.productType === "vip") nextData.membership = "vip";
    nextData.keys = currentKeys + localOrder.keys;

    transaction.set(userRef, { ...user, ...nextData }, { merge: true });
    transaction.set(auditRef, {
      type: localOrder.productType === "vip" ? "vip_bonus" : "purchase",
      amount: localOrder.keys,
      orderId: localOrder.orderId,
      createdAt: new Date().toISOString(),
    }, { merge: false });
    transaction.update(paymentRef, nextData);
  });
}
