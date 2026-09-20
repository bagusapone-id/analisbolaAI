"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/i18n";
import { getSlip, getSlipMatches, deleteSlip, deleteMatchFromSlip, updateSlipVisibility } from "@/lib/firestore";
import type { SlipData, SlipMatchData } from "@/lib/types";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { TopAppBar } from "@/components/layout/TopAppBar";
import { Plus, ChevronRight, MoreVertical, Trash2, TrendingUp } from "lucide-react";
import clsx from "clsx";

type SlipWithMeta = SlipData & { id: string; matchCount: number };
type SlipMatchWithId = SlipMatchData & { id: string };

export default function SlipDetailPage() {
  const params = useParams<{ slipId: string }>();
  const { user } = useAuth();
  const { t, tMatch } = useLang();
  const router = useRouter();

  const [slip, setSlip]       = useState<SlipWithMeta | null>(null);
  const [matches, setMatches] = useState<SlipMatchWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  // Overflow menu
  const [menuOpen, setMenuOpen]         = useState(false);
  const menuRef                         = useRef<HTMLDivElement>(null);

  // Delete slip
  const [showDeleteSlip, setShowDeleteSlip] = useState(false);
  const [deletingSlip, setDeletingSlip]     = useState(false);

  // Delete match
  const [deleteMatchTarget, setDeleteMatchTarget]   = useState<SlipMatchWithId | null>(null);
  const [deletingMatch, setDeletingMatch]           = useState(false);
  const [deleteMatchError, setDeleteMatchError]     = useState("");
  const [visibilityError, setVisibilityError]       = useState("");

  useEffect(() => {
    if (!user || !params.slipId) return;
    Promise.all([
      getSlip(user.uid, params.slipId),
      getSlipMatches(user.uid, params.slipId),
    ]).then(([s, m]) => {
      if (!s) setError(t("slipNotFound"));
      else { setSlip(s); setMatches(m); }
    }).catch(() => setError(t("failedLoadSlip")))
      .finally(() => setLoading(false));
  }, [user, params.slipId, t]);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDeleteSlip = async () => {
    if (!user || !slip) return;
    setDeletingSlip(true);
    try {
      await deleteSlip(user.uid, slip.id);
      router.push("/slips");
    } catch (err) {
      setDeletingSlip(false);
      setShowDeleteSlip(false);
      setDeleteMatchError(err instanceof Error ? err.message : t("failedDeleteSlip"));
    }
  };

  const handleDeleteMatch = async () => {
    if (!user || !slip || !deleteMatchTarget) return;
    setDeletingMatch(true);
    setDeleteMatchError("");
    try {
      await deleteMatchFromSlip(user.uid, slip.id, deleteMatchTarget.id);
      setMatches((p) => p.filter((m) => m.id !== deleteMatchTarget.id));
      setSlip((p) => p ? { ...p, matchCount: Math.max(0, p.matchCount - 1) } : p);
      setDeleteMatchTarget(null);
    } catch (err) {
      setDeleteMatchError(err instanceof Error ? err.message : t("failedDeleteMatch"));
    } finally {
      setDeletingMatch(false);
    }
  };

  const toggleVisibility = async () => {
    if (!user || !slip) return;
    const visibility = slip.visibility === "public" ? "private" : "public";
    try {
      await updateSlipVisibility(user.uid, slip.id, visibility);
      setSlip((current) => current ? { ...current, visibility } : current);
      setMenuOpen(false);
    } catch (error) {
      setVisibilityError(error instanceof Error ? error.message : "Gagal mengubah visibility.");
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Spinner size="lg" className="text-green-600" />
    </div>
  );
  if (error || !slip) return (
    <div className="page"><TopAppBar title="—" backHref="/slips" /><div className="page-body"><p className="error-msg px-4 py-4">{error}</p></div></div>
  );

  const OverflowMenu = (
    <div className="relative" ref={menuRef}>
      <button onClick={() => setMenuOpen((p) => !p)} className="btn-icon">
        <MoreVertical size={20} />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-surface rounded-lg shadow-mid border border-line min-w-[160px] py-1">
          <button
            onClick={() => { setMenuOpen(false); setShowDeleteSlip(true); }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-[14px] text-danger active:bg-bg"
          >
            <Trash2 size={15} />
            {t("deleteSlip")}
          </button>
          {slip.ownerRole === "admin" && (
            <button
              onClick={toggleVisibility}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-[14px] text-t2 active:bg-bg"
            >
              {slip.visibility === "public" ? "Make Private" : "Publish Public"}
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="page">
      <TopAppBar
        title={slip.name}
        backHref="/slips"
        right={OverflowMenu}
      />
      <div className="page-body">
      <div className="px-4 py-3 bg-bg border-b border-line">
        {slip.description && (
          <p className="text-[13px] text-t2 mb-1">{slip.description}</p>
        )}
        <p className="text-[12px] text-t3">
          {tMatch(slip.matchCount)} · {new Date(slip.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
      </div>

      {/* Section header + add button */}
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-t3">Matches</p>
        <Link
          href={`/slips/${params.slipId}/matches/new`}
          className="flex items-center gap-1 text-[13px] text-green-600 font-semibold"
        >
          <Plus size={15} />
          {t("addMatch")}
        </Link>
      </div>

      {deleteMatchError && <p className="error-msg">{deleteMatchError}</p>}
      {visibilityError && <p className="error-msg">{visibilityError}</p>}

      {matches.length === 0 ? (
        <div className="flex flex-col items-center py-14 px-6 text-center">
          <TrendingUp size={36} className="text-t3 mb-3" />
          <p className="text-[15px] font-semibold text-t1">{t("noMatchesYet")}</p>
          <p className="text-[13px] text-t3 mt-1 mb-5 max-w-xs">{t("noMatchesDesc")}</p>
          <Link href={`/slips/${params.slipId}/matches/new`} className="btn-primary">
            <Plus size={16} />
            {t("addMatch")}
          </Link>
        </div>
      ) : (
        <div className="list-surface">
          {matches.map((match) => {
            const { homeWin, draw, awayWin } = match.prediction;
            const top = homeWin > draw && homeWin > awayWin ? "H"
              : awayWin > draw ? "A" : "D";
            return (
              <div key={match.id} className="list-row pr-2">
                <button
                  className="flex-1 min-w-0 text-left flex items-center gap-3"
                  onClick={() => router.push(`/slips/${params.slipId}/matches/${match.id}`)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-t3 mb-0.5">{match.competition}</p>
                    <p className="list-row-title truncate">
                      {match.homeTeam} <span className="text-t3 font-normal">vs</span> {match.awayTeam}
                    </p>
                    <div className="flex gap-2 mt-1">
                      {[
                        { l: "H", v: homeWin },
                        { l: "D", v: draw },
                        { l: "A", v: awayWin },
                      ].map(({ l, v }) => (
                        <span
                          key={l}
                          className={clsx(
                            "text-[11px] font-bold",
                            top === l ? "text-green-600" : "text-t3"
                          )}
                        >
                          {l} {v}%
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-t3 shrink-0" />
                </button>
                <button
                  onClick={() => setDeleteMatchTarget(match)}
                  className="btn-icon ml-1 text-t3 hover:text-danger"
                  aria-label="Delete match"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={showDeleteSlip}
        title={t("deleteSlipConfirmTitle")}
        description={t("deleteSlipConfirmDesc")}
        itemName={slip.name}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        loading={deletingSlip}
        variant="danger"
        onConfirm={handleDeleteSlip}
        onCancel={() => setShowDeleteSlip(false)}
      />
      <ConfirmDialog
        open={!!deleteMatchTarget}
        title={t("deleteMatchConfirmTitle")}
        description={t("deleteMatchConfirmDesc")}
        itemName={deleteMatchTarget ? `${deleteMatchTarget.homeTeam} vs ${deleteMatchTarget.awayTeam}` : undefined}
        confirmLabel={t("delete")}
        cancelLabel={t("cancel")}
        loading={deletingMatch}
        variant="danger"
        onConfirm={handleDeleteMatch}
        onCancel={() => setDeleteMatchTarget(null)}
      />
      </div>
    </div>
  );
}
