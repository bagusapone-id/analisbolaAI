import { describe, expect, it } from "vitest";
import { createPakasirPaymentUrl } from "../lib/pakasir";
import { getPaymentProduct } from "../lib/payment-products";

describe("Pakasir payment configuration", () => {
  it("creates the documented payment URL without exposing credentials", () => {
    const url = createPakasirPaymentUrl({
      slug: "depodomain",
      amount: 22000,
      orderId: "ORDER-123",
      redirectUrl: "https://example.com/store/payment/result?order_id=ORDER-123",
    });
    expect(url).toBe("https://app.pakasir.com/pay/depodomain/22000?order_id=ORDER-123&redirect=https%3A%2F%2Fexample.com%2Fstore%2Fpayment%2Fresult%3Forder_id%3DORDER-123");
    expect(url).not.toContain("api_key");
  });

  it("resolves server-side product prices and Key amounts", () => {
    expect(getPaymentProduct("vip")).toMatchObject({ productType: "vip", keys: 10, amount: 159000 });
    expect(getPaymentProduct("key_5")).toMatchObject({ productType: "key", keys: 5, amount: 10000 });
    expect(getPaymentProduct("custom_price")).toBeNull();
  });
});
