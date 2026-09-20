"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3 } from "lucide-react";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Spinner } from "@/components/ui/Spinner";
import { apiFetch } from "@/lib/api-client";

type Payment = {
  status: "pending" | "completed" | "cancelled";
  amount: number;
  keys: number;
  productType: string;
};

function PaymentResultContent() {
  const params = useSearchParams();
  const orderId = params.get("order_id");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setError("Order tidak ditemukan.");
      return;
    }
    let active = true;
    const load = async () => {
      try {
        const result = await apiFetch<Payment>(
          `/api/payment/pakasir/status?order_id=${encodeURIComponent(orderId)}`
        );
        if (active) setPayment(result);
      } catch (e) {
        if (active)
          setError(
            e instanceof Error ? e.message : "Gagal memuat status pembayaran."
          );
      }
    };
    load();
    const timer = window.setInterval(() => {
      if (!payment || payment.status === "pending") load();
    }, 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [orderId, payment]);

  return (
    <div className="bg-surface border border-line rounded-md p-5 text-center">
      {!payment && !error && (
        <Spinner size="lg" className="text-green-600 mx-auto" />
      )}
      {error && <p className="error-msg px-0">{error}</p>}
      {payment?.status === "completed" && (
        <>
          <CheckCircle2 size={42} className="text-green-600 mx-auto mb-3" />
          <p className="text-[18px] font-semibold text-t1">
            Pembayaran berhasil
          </p>
          <p className="text-[13px] text-t3 mt-1">
            {payment.productType === "vip"
              ? "Membership VIP dan 10 Key sudah aktif."
              : `${payment.keys} Key sudah ditambahkan.`}
          </p>
        </>
      )}
      {payment?.status === "pending" && (
        <>
          <Clock3 size={42} className="text-amber-500 mx-auto mb-3" />
          <p className="text-[18px] font-semibold text-t1">
            Menunggu verifikasi
          </p>
          <p className="text-[13px] text-t3 mt-1">
            Status akan berubah setelah Pakasir mengirim webhook dan transaksi
            diverifikasi.
          </p>
        </>
      )}
      {payment?.status === "cancelled" && (
        <p className="text-[18px] font-semibold text-t1">
          Pembayaran dibatalkan
        </p>
      )}
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <div className="page">
      <TopAppBar title="Status Pembayaran" backHref="/store" />
      <div className="page-body px-4 py-8">
        <Suspense
          fallback={
            <div className="bg-surface border border-line rounded-md p-5 text-center">
              <Spinner size="lg" className="text-green-600 mx-auto" />
            </div>
          }
        >
          <PaymentResultContent />
        </Suspense>
      </div>
    </div>
  );
}
