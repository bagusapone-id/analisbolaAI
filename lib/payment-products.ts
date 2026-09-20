export const PAYMENT_PRODUCTS = {
  vip: { id: "vip", productType: "vip" as const, keys: 10, amount: 159000, label: "VIP" },
  key_1: { id: "key_1", productType: "key" as const, keys: 1, amount: 3000, label: "1 Key" },
  key_5: { id: "key_5", productType: "key" as const, keys: 5, amount: 10000, label: "5 Keys" },
  key_15: { id: "key_15", productType: "key" as const, keys: 15, amount: 25000, label: "15 Keys" },
} as const;

export type PaymentProductId = keyof typeof PAYMENT_PRODUCTS;

export function getPaymentProduct(productId: string) {
  return PAYMENT_PRODUCTS[productId as PaymentProductId] ?? null;
}
