import { PAYMENT_PRODUCTS } from "@/lib/payment-products";

export async function GET() {
  return Response.json({ products: Object.values(PAYMENT_PRODUCTS).map(({ id, productType, keys, amount, label }) => ({ id, productType, keys, amount, label })) });
}
