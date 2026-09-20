"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/i18n";
import { getUserSlips, deleteSlip } from "@/lib/firestore";
import type { SlipData } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Plus, ChevronRight, Layers, Trash2 } from "lucide-react";

type SlipWithId = SlipData & { id: string; matchCount: number };

export default function SlipsPage() {
  const { user } = useAuth();
  const { t, tMatch } = useLang();
  const router = useRouter();

  const [slips, setSlips]     = useState<SlipWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SlipWithId | null>(null);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserSlips(user.uid)
      .then(setSlips)
      .catch(() => setError(t("failedLoadSlips")))
      .finally(() => setLoading(false));
  }, [user, t]);

  const handleDelete = async () => {
    if (!user || !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSlip(user.uid, deleteTarget.id);
      setSlips((p) => p.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page">
      <TopAppBar
        title={t("slipsTitle")}
        right={
          <Link href="/slips/new" className="btn-ghost text-green-600 gap-1 pr-0">
            <Plus size={20} />
          </Link>
        }
      />
      <div className="page-body">
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" className="text-green-600" />
        </div>
      ) : error ? (
        <p className="error-msg">{error}</p>
      ) : slips.length === 0 ? (
        <div className="flex flex-col items-center py-14 px-6 text-center">
          <Layers size={36} className="text-t3 mb-3" />
          <p className="text-[15px] font-semibold text-t1">{t("noSlipsYet")}</p>
          <p className="text-[13px] text-t3 mt-1 mb-5 max-w-xs">{t("noSlipsDesc")}</p>
          <Link href="/slips/new" className="btn-primary">
            <Plus size={16} />
            {t("createFirstSlip")}
          </Link>
        </div>
      ) : (
        <div className="list-surface mt-0">
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
                  onClick={() => setDeleteTarget(slip)}
                  className="btn-icon ml-1 text-t3 hover:text-danger"
                  aria-label="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title={t("deleteSlipConfirmTitle")}
        description={t("deleteSlipConfirmDesc")}
        itemName={deleteTarget?.name}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        loading={deleting}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      </div>
    </div>
  );
}
