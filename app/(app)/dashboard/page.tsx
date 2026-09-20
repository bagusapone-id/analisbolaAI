"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/i18n";
import { getUserSlips, deleteSlip } from "@/lib/firestore";
import { apiFetch } from "@/lib/api-client";
import type { SlipData } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Plus, ChevronRight, Layers, Trash2, Lock, Unlock } from "lucide-react";

type SlipWithId = SlipData & { id: string; matchCount: number };
type PublicSlip = { id: string; name: string; description: string; matchCount: number; unlocked: boolean };

function greeting(t: (k: "greetMorning" | "greetAfternoon" | "greetEvening") => string) {
  const h = new Date().getHours();
  if (h < 12) return t("greetMorning");
  if (h < 17) return t("greetAfternoon");
  return t("greetEvening");
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, tMatch } = useLang();
  const router = useRouter();

  // My slips
  const [slips, setSlips]         = useState<SlipWithId[]>([]);
  const [slipsLoading, setSlipsLoading] = useState(true);
  const [slipsError, setSlipsError]     = useState("");

  // Delete slip
  const [deleteTarget, setDeleteTarget] = useState<SlipWithId | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [deleteError, setDeleteError]   = useState("");

  // Slip Jadi
  const [publicSlips, setPublicSlips]         = useState<PublicSlip[]>([]);
  const [publicLoading, setPublicLoading]     = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserSlips(user.uid)
      .then(setSlips)
      .catch(() => setSlipsError(t("failedLoadSlips")))
      .finally(() => setSlipsLoading(false));
  }, [user, t]);

  useEffect(() => {
    apiFetch<{ slips: PublicSlip[] }>("/api/public-slips")
      .then(({ slips }) => setPublicSlips(slips))
      .catch(() => undefined)
      .finally(() => setPublicLoading(false));
  }, []);

  const handleConfirmDelete = async () => {
    if (!user || !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSlip(user.uid, deleteTarget.id);
      setSlips((p) => p.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : t("failedDeleteSlip"));
    } finally {
      setDeleting(false);
    }
  };

  const greet = greeting(t as Parameters<typeof greeting>[0]);

  return (
    <div className="page">
      <TopAppBar
        title={t("dashboardTitle")}
        right={<span className="text-[12px] font-medium text-t3">{greet}</span>}
      />
      <div className="page-body">

        {deleteError && <p className="error-msg px-4 pb-2">{deleteError}</p>}

        {/* ── My Slips ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 mb-1 pt-1">
          <p className="section-header p-0">{t("dashboardLabel")}</p>
          <Link
            href="/slips/new"
            className="flex items-center gap-1 text-[13px] text-green-600 font-semibold py-1"
          >
            <Plus size={15} />
            {t("newSlip")}
          </Link>
        </div>

        {slipsLoading ? (
          <div className="flex justify-center py-10">
            <Spinner size="lg" className="text-green-600" />
          </div>
        ) : slipsError ? (
          <p className="error-msg">{slipsError}</p>
        ) : slips.length === 0 ? (
          <div className="flex flex-col items-center py-10 px-6 text-center">
            <Layers size={32} className="text-t3 mb-3" />
            <p className="text-[15px] font-semibold text-t1">{t("noSlipsYet")}</p>
            <p className="text-[13px] text-t3 mt-1 mb-4 max-w-xs">{t("noSlipsDesc")}</p>
            <Link href="/slips/new" className="btn-primary">
              <Plus size={16} />
              {t("createFirstSlip")}
            </Link>
          </div>
        ) : (
          <div className="list-surface mb-2">
            {slips.map((slip) => {
              const date = new Date(slip.createdAt).toLocaleDateString("en-GB", {
                day: "2-digit", month: "short", year: "numeric",
              });
              return (
                <div key={slip.id} className="flex items-center list-row pr-2">
                  <button
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    onClick={() => router.push(`/slips/${slip.id}`)}
                  >
                    <Layers size={18} className="text-green-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="list-row-title truncate">{slip.name}</p>
                      <p className="list-row-sub">{tMatch(slip.matchCount)} · {date}</p>
                    </div>
                    <ChevronRight size={16} className="text-t3 shrink-0" />
                  </button>
                  <button
                    onClick={() => { setDeleteError(""); setDeleteTarget(slip); }}
                    className="btn-icon ml-1 text-t3 hover:text-danger active:text-danger"
                    aria-label="Delete slip"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ── VIP Slip Prediction ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 mb-1 pt-3">
          <div className="flex items-center gap-1.5">
            <p className="section-header p-0 text-green-600">VIP Slip Prediction</p>
          </div>
          <Link
            href="/slip-jadi"
            className="text-[13px] text-green-600 font-semibold py-1"
          >
            Lihat Semua
          </Link>
        </div>

        {publicLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="md" className="text-green-600" />
          </div>
        ) : publicSlips.length === 0 ? (
          <div className="flex flex-col items-center py-8 px-6 text-center">
            <p className="text-[13px] text-t3">Belum ada VIP Slip Prediction.</p>
          </div>
        ) : (
          <div className="list-surface">
            {publicSlips.slice(0, 5).map((slip) => (
              <button
                key={slip.id}
                className="list-row w-full text-left"
                onClick={() => router.push(`/slip-jadi/${slip.id}`)}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-50 text-green-600 shrink-0">
                  {slip.unlocked
                    ? <Unlock size={16} />
                    : <Lock size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="list-row-title truncate">{slip.name}</p>
                  <p className="list-row-sub">
                    {slip.matchCount} laga · {slip.unlocked ? "Unlocked" : "1 Key"}
                  </p>
                </div>
                <ChevronRight size={16} className="text-t3 shrink-0" />
              </button>
            ))}
            {publicSlips.length > 5 && (
              <Link
                href="/slip-jadi"
                className="list-row justify-center text-[13px] font-semibold text-green-600"
              >
                Lihat {publicSlips.length - 5} lagi →
              </Link>
            )}
          </div>
        )}

      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t("deleteSlipConfirmTitle")}
        description={t("deleteSlipConfirmDesc")}
        itemName={deleteTarget?.name}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        loading={deleting}
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
