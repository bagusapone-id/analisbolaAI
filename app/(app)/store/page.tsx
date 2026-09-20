"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, KeyRound, ShoppingBag } from "lucide-react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Spinner } from "@/components/ui/Spinner";
import { apiFetch } from "@/lib/api-client";

type Product = { id: string; productType: "vip" | "key"; keys: number; amount: number; label: string };

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/payment/products").then((response) => response.json()).then((body) => setProducts(body.products ?? [])).catch(() => setError("Gagal memuat produk.")).finally(() => setLoading(false));
  }, []);

  const buy = async (productId: string) => {
    setBuying(productId); setError("");
    try {
      const result = await apiFetch<{ paymentUrl: string }>("/api/payment/pakasir/create", { method: "POST", body: JSON.stringify({ productId }) });
      window.location.href = result.paymentUrl;
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal membuat order."); setBuying(""); }
  };

  const vip = products.find((product) => product.productType === "vip");
  const keyProducts = products.filter((product) => product.productType === "key");
  const formatPrice = (amount: number) => `Rp${amount.toLocaleString("id-ID")}`;

  return (
    <div className="page">
      <TopAppBar title="Toko" backHref="/menu" />
      <div className="page-body">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={19} className="text-green-600" />
            <h1 className="text-[17px] font-semibold text-t1">Toko</h1>
          </div>
          <p className="text-[12px] text-t3 mt-1">Pilih paket yang kamu butuhkan.</p>
        </div>

        {error && <p className="error-msg px-4 mb-3">{error}</p>}
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" className="text-green-600" /></div>
        ) : (
          <div className="px-4 space-y-4">
            {vip && (
              <div className="rounded-md bg-green-600 p-4 text-white">
                <div className="flex items-start gap-3">
                  <Crown size={22} className="shrink-0 text-yellow-300" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[17px] font-bold">VIP</p>
                        <p className="text-[12px] text-green-100 mt-1">Unlimited Slip · Unlimited Match · +10 Key</p>
                      </div>
                      <p className="text-[16px] font-bold whitespace-nowrap">{formatPrice(vip.amount)}</p>
                    </div>
                    <button type="button" onClick={() => buy(vip.id)} disabled={!!buying} className="mt-4 w-full rounded-md bg-white px-4 py-2.5 text-[14px] font-semibold text-green-700 active:opacity-80">
                      {buying === vip.id ? <Spinner size="sm" /> : "Upgrade VIP"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-t3 mb-2">Beli Key</p>
              <div className="bg-surface border border-line rounded-md divide-y divide-line">
                {keyProducts.map((product) => (
                  <div key={product.id} className="flex items-center gap-3 px-3 py-3">
                    <KeyRound size={17} className="text-amber-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-t1">{product.keys} Key</p>
                      <p className="text-[11px] text-t3">{formatPrice(product.amount)}</p>
                    </div>
                    <button type="button" onClick={() => buy(product.id)} disabled={!!buying} className="btn-secondary min-h-9 px-3 py-1.5 text-[12px]">
                      {buying === product.id ? <Spinner size="sm" /> : "Beli"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-t3 pb-4">Pembayaran diproses melalui Pakasir. Membership dan Key aktif setelah pembayaran terverifikasi.</p>
          </div>
        )}
      </div>
    </div>
  );
}
