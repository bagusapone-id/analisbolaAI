"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/i18n";
import { getSlipMatch, deleteMatchFromSlip } from "@/lib/firestore";
import type { SlipMatchData } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { MatchDetailView } from "@/components/prediction/MatchDetailView";
import { MoreVertical, Trash2 } from "lucide-react";

type M = SlipMatchData & { id: string };

export default function MatchResultPage() {
  const params   = useParams<{ slipId: string; matchId: string }>();
  const { user } = useAuth();
  const { t }    = useLang();
  const router   = useRouter();

  const [match, setMatch]       = useState<M | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDel, setShowDel]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !params.slipId || !params.matchId) return;
    getSlipMatch(user.uid, params.slipId, params.matchId)
      .then((d) => { if (!d) setError(t("matchNotFound")); else setMatch(d); })
      .catch(() => setError(t("failedLoadMatch")))
      .finally(() => setLoading(false));
  }, [user, params.slipId, params.matchId, t]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleDelete = async () => {
    if (!user || !match) return;
    setDeleting(true);
    try {
      await deleteMatchFromSlip(user.uid, params.slipId, match.id);
      router.push(`/slips/${params.slipId}`);
    } catch { setDeleting(false); setShowDel(false); }
  };

  if (loading) return (
    <div className="flex justify-center items-center flex-1 bg-bg">
      <Spinner size="lg" className="text-green-600" />
    </div>
  );
  if (error || !match) return (
    <div className="page">
      <TopAppBar title="—" backHref={`/slips/${params.slipId}`} />
      <div className="page-body"><p className="error-msg px-4 py-4">{error}</p></div>
    </div>
  );

  const OverflowMenu = (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setMenuOpen((p) => !p)} className="btn-icon">
        <MoreVertical size={20} />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-surface rounded-lg shadow-mid border border-line min-w-[160px] py-1">
          <button
            onClick={() => { setMenuOpen(false); setShowDel(true); }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-[14px] text-danger active:bg-bg"
          >
            <Trash2 size={15} />
            {t("deleteMatch")}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="page">
      <TopAppBar
        title={`${match.homeTeam} vs ${match.awayTeam}`}
        backHref={`/slips/${params.slipId}`}
        right={OverflowMenu}
      />
      <div className="page-body">
        <MatchDetailView
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          competition={match.competition}
          prediction={match.prediction}
          homeStanding={match.homeStanding}
          awayStanding={match.awayStanding}
          homeLast3={match.homeLast3}
          awayLast3={match.awayLast3}
          aiAnalysis={match.aiAnalysis}
        />

        <ConfirmDialog
          open={showDel}
          title={t("deleteMatchConfirmTitle")}
          description={t("deleteMatchConfirmDesc")}
          itemName={`${match.homeTeam} vs ${match.awayTeam}`}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          loading={deleting}
          variant="danger"
          onConfirm={handleDelete}
          onCancel={() => setShowDel(false)}
        />
      </div>
    </div>
  );
}
